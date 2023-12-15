// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, remote, screen, session} = require('electron');
const path = require('path');
const Store = require('./src/js/db/local_storage.js');
const {userAuthConfigName} = require('./src/js/constants/local-storage-constants.js');
const updater = require('./updater.js')
// const {signInUsingEmailAndPasswordFromCookieDetails} = require('./src/js/auth/authenticate-using-cookie.js');
// const ProgressBar = require('electron-progressbar');

let progressBar;
let mainWindow;


// This renderer process gets the user data path ie, local partition path of users system.
// This is required because we are storing contact and message details in the location.
// Since, user path details cannot be retrieved from any other page other than main.js, we have setup a process
// with which connection can be made by any page and the path can be retreived. 
ipcMain.handle('asynchronous-message', async (event, messageObj) => {
  if (messageObj = 'getUserDataPath'){
    const userDataPath = (app || remote.app).getPath('userData');
    return userDataPath
  }
});


//We cannot set cookies from any other page than main.js.
//Hence, this process is setup with which connection can be made by any page
//and cookie values can be set.
ipcMain.handle('set-cookies', async (event, cookieObj) => {
  session.defaultSession.cookies.set(cookieObj)
  .then(() => {
    console.log("setting cookie successful");
    console.log(cookieObj);
    return true;
  }, (error) => {
    console.error(error);
    return false;
  })
});



//We cannot get cookies information from any other page than main.js
//Hence, this process is setup with which connection can be made by any page
//and cookies details can be retereived. 
ipcMain.handle('get-cookies', async (event, name) => {
  var cookies = await getCookies(name);
  return cookies;
});


ipcMain.handle('progress', async (event, name) => {
  var cookies = await startProgressBar();
  return cookies;
});



ipcMain.handle('update_progress', async (event, progress_bar_details) => {
  var text = null;
  var detail = null;
  var value = null;
  if ('value' in progress_bar_details){
    value = progress_bar_details["value"];
  }
  if('text' in progress_bar_details){
    text = progress_bar_details["text"];
  }
  if('detail' in progress_bar_details){
    detail = progress_bar_details["detail"];
  }
  var cookies = await setProgressBarValue(value, text, detail);
  return cookies;
});


async function getCookies(name){
  var cookies = await session.defaultSession.cookies.get({});
  for(var i=0; i<cookies.length; i++){
    if (cookies[i]["name"] == name){
      return cookies[i]["value"];
    }
  }
  return null;
}


const userDataPath = (app || remote.app).getPath('userData');
console.log(userDataPath)
const store = new Store({
  userDataPath: userDataPath,
  configName: userAuthConfigName,
  defaults: {
    auth: false
  }
});




//This function is responsible for identifying if user needs to login or not.
//If user has to login, login page is shown
//Else, we authenticate and go to home page directly.
async function get_home_page_path(){

  // We need to show different page depending on if user is authenticated or not.
  let isAuthenticated = store.get('auth')
  var authDetails = await getCookies("auth_details");

  // Checking if user is authenticated.
  // If yes - Login using firebase with the details stored in cookies.
  // If No - Show login page.
  if (isAuthenticated){
    const {signInUsingEmailAndPasswordFromCookieDetails} = require('./src/js/auth/authenticate-using-cookie.js');

    const authenticationResult = await signInUsingEmailAndPasswordFromCookieDetails(authDetails);
    if (authenticationResult){
      return('./src/html/pages/home.html')
    }
    return('./src/html/auth/login_page.html')

  }
  else{
    return('./src/html/auth/login_page.html')
  }

}

async function startProgressBar(){
  const ProgressBar = require('electron-progressbar');
  progressBar = new ProgressBar({
      indeterminate: false,
      title: 'Whatsall',
      text: 'Loading Whatsapp Configurations...',
      detail: 'Please Wait...',
      browserWindow: {
        closable:true,
        parent: mainWindow
      }
    });
    
    
    progressBar
      .on('completed', function() {
        console.info(`completed...`);
        progressBar.detail = 'Task completed. Exiting...';
      })
      .on('aborted', function(value) {
        console.info(`aborted... ${value}`);
        progressBar.close();
        mainWindow.close();

        return;
      })
    
    // launch a task and increase the value of the progress bar for each step completed of a big task;
    // the progress bar is set to completed when it reaches its maxValue (default maxValue: 100);
    // ps: setInterval is used here just to simulate the progress of a task
    // setInterval(function() {
    //   if(!progressBar.isCompleted()){
    //     progressBar.value += 1;
    //   }
    // }, 2000);
    return true;
}


async function setProgressBarValue(value=null, text=null, detail=null){
  if (progressBar) {
    if (value){
      if (progressBar.value + value > 100){
        progressBar.value = 100;
      }else{
        progressBar.value += value;
      }
    }
    if (text){
      progressBar.text = text;
    }
    if (detail){
      progressBar.detail = detail;
    }
  }
  return;
}


//This function is responsible for creating window for electron app.
async function createWindow () {

  //Checking for app updates in background after 5seconds of software launch
  setTimeout(updater, 5000);

  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    icon: __dirname + './src/img/whatsall.png',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });


  home_page_path = await get_home_page_path();
  mainWindow.loadFile(home_page_path);
  mainWindow.setMenu(null);

  



  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
