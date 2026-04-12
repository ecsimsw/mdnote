const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mdviewer", {
  saveFile: (content) => ipcRenderer.send("save-file", content),
  savePdf: () => ipcRenderer.invoke("save-pdf"),
});
