on run
	set mdFiles to choose file with prompt "Select a Markdown file" of type {"md", "markdown"} with multiple selections allowed
	convertFiles(mdFiles)
end run

on open filePaths
	convertFiles(filePaths)
end open

on convertFiles(filePaths)
	repeat with f in filePaths
		set filePath to POSIX path of f
		set scriptFile to "/tmp/_mdviewer_run_" & (random number from 10000 to 99999) & ".sh"
		do shell script "echo '#!/bin/bash
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH
mdviewer \"$1\"
rm -f \"$0\"
' > " & quoted form of scriptFile & " && chmod +x " & quoted form of scriptFile
		do shell script quoted form of scriptFile & " " & quoted form of filePath & " </dev/null >/dev/null 2>&1 &"
	end repeat
end convertFiles
