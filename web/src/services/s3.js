function hmacSha256(key, msg) {
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
}

async function importKey(keyData) {
  return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function sha256(data) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function toHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(secretKey, dateStamp, region, service) {
  let key = await importKey(new TextEncoder().encode('AWS4' + secretKey));
  key = await importKey(await hmacSha256(key, dateStamp));
  key = await importKey(await hmacSha256(key, region));
  key = await importKey(await hmacSha256(key, service));
  key = await importKey(await hmacSha256(key, 'aws4_request'));
  return key;
}

async function signRequest({ method, host, path, query, headers: hdrs, body, accessKey, secretKey, region, service }) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const dateStamp = amzDate.substring(0, 8);

  const allHeaders = { ...hdrs, host, 'x-amz-date': amzDate, 'x-amz-content-sha256': await sha256(body || '') };
  const signedHeaderKeys = Object.keys(allHeaders).sort();
  const signedHeaders = signedHeaderKeys.join(';');
  const canonicalHeaders = signedHeaderKeys.map(k => `${k}:${allHeaders[k]}\n`).join('');

  const canonicalRequest = [method, path, query || '', canonicalHeaders, signedHeaders, await sha256(body || '')].join('\n');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await sha256(canonicalRequest)].join('\n');

  const signingKey = await getSignatureKey(secretKey, dateStamp, region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { ...allHeaders, authorization };
}

function handleS3Error(res) {
  if (res.status === 0 || res.type === 'opaque') {
    throw new Error('S3 연결 실패: 버킷의 CORS 설정이 필요합니다.\n\n버킷 > 권한 > CORS에 다음을 추가하세요:\n[\n  {\n    "AllowedOrigins": ["*"],\n    "AllowedMethods": ["GET", "PUT", "DELETE"],\n    "AllowedHeaders": ["*"],\n    "ExposeHeaders": ["ETag"]\n  }\n]');
  }
  if (res.status === 403) throw new Error('S3 인증 실패: Access Key / Secret Key를 다시 확인해주세요.');
  if (res.status === 404) throw new Error('버킷을 찾을 수 없습니다.');
  if (!res.ok) throw new Error(`S3 오류 (${res.status})`);
}

export async function listBuckets(accessKey, secretKey, region = 'us-east-1') {
  const host = 's3.amazonaws.com';
  const signed = await signRequest({
    method: 'GET', host, path: '/', query: '', body: '',
    headers: {}, accessKey, secretKey, region, service: 's3',
  });

  let res;
  try {
    res = await fetch(`https://${host}/`, { headers: signed });
  } catch {
    throw new Error('S3 연결 실패: 버킷의 CORS 설정이 필요합니다.\n\n버킷 > 권한 > CORS에 다음을 추가하세요:\n[\n  {\n    "AllowedOrigins": ["*"],\n    "AllowedMethods": ["GET", "PUT", "DELETE"],\n    "AllowedHeaders": ["*"],\n    "ExposeHeaders": ["ETag"]\n  }\n]');
  }
  handleS3Error(res);
  const text = await res.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  return Array.from(xml.querySelectorAll('Bucket')).map(b => ({
    name: b.querySelector('Name').textContent,
  }));
}

export async function listMdFiles(accessKey, secretKey, bucket, region = 'us-east-1') {
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const signed = await signRequest({
    method: 'GET', host, path: '/', query: 'list-type=2', body: '',
    headers: {}, accessKey, secretKey, region, service: 's3',
  });

  let res;
  try {
    res = await fetch(`https://${host}/?list-type=2`, { headers: signed });
  } catch {
    throw new Error('S3 연결 실패: 버킷의 CORS 설정을 확인해주세요.');
  }
  handleS3Error(res);
  const text = await res.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  return Array.from(xml.querySelectorAll('Contents'))
    .map(c => ({ path: c.querySelector('Key').textContent, etag: (c.querySelector('ETag')?.textContent || '').replace(/"/g, '') }))
    .filter(f => /\.md$/i.test(f.path));
}

export async function getFileContent(accessKey, secretKey, bucket, path, region = 'us-east-1') {
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const encodedPath = '/' + path.split('/').map(encodeURIComponent).join('/');
  const signed = await signRequest({
    method: 'GET', host, path: encodedPath, query: '', body: '',
    headers: {}, accessKey, secretKey, region, service: 's3',
  });

  let res;
  try {
    res = await fetch(`https://${host}${encodedPath}`, { headers: signed });
  } catch {
    throw new Error('S3 파일 로드 실패: CORS 설정을 확인해주세요.');
  }
  handleS3Error(res);
  const content = await res.text();
  const etag = (res.headers.get('ETag') || '').replace(/"/g, '');
  return { content, etag };
}

export async function putFile(accessKey, secretKey, bucket, path, content, region = 'us-east-1') {
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const encodedPath = '/' + path.split('/').map(encodeURIComponent).join('/');
  const signed = await signRequest({
    method: 'PUT', host, path: encodedPath, query: '', body: content,
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
    accessKey, secretKey, region, service: 's3',
  });

  let res;
  try {
    res = await fetch(`https://${host}${encodedPath}`, { method: 'PUT', headers: signed, body: content });
  } catch {
    throw new Error('S3 업로드 실패: CORS 설정을 확인해주세요.');
  }
  handleS3Error(res);
  return true;
}
