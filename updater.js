const {autoUpdater} = require("electron-updater");
const {dialog} = require("electron");

autoUpdater.autoDownload = false;
module.exports = () => {
    //Checking for github releases.
    // console.log("checking for updates");
    autoUpdater.checkForUpdates();
    autoUpdater.on('update-available', () => {
        dialog.showMessageBox({
            type: 'info',
            title: 'Update available',
            message: 'A new version of whatsall is available. Do you want to update now?',
            buttons: ['Update', 'Later']
        }).then(result => {
            let buttonIndex = result.response
            if (buttonIndex === 0) autoUpdater.downloadUpdate()
        })
    })

    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox({
            type: 'info',
            title: 'Update ready',
            message: 'Install & restart now?',
            buttons: ['Yes', 'Later']
        }).then(result => {
            let buttonIndex = result.response
            if (buttonIndex === 0) autoUpdater.quitAndInstall(false, true)
        })
    })
}