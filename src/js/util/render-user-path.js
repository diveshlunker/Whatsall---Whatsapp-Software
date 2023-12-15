
var ipcRenderer = require('electron').ipcRenderer;

async function renderUserPath() {
    const result = await ipcRenderer.invoke('asynchronous-message', 'getUserDataPath')
    return result
}

module.exports = {
    renderUserPath: renderUserPath
}