// const { Builder, By, Key, until, webdriver } = require('selenium-webdriver');
// const chrome = require('selenium-webdriver/chrome');

const puppeteer = require('puppeteer');
const chromium = require('chromium');
const Handlebars = require('handlebars');
const admin = require('firebase-admin');
const serviceAccount = require('../../support_files/firebase_auth.json');
const {authenticateIP} = require('../auth/authentication-check-before-action.js');
const Store = require('../../js/db/local_storage.js');
const {messagingReportConfigName} = require('../../js/constants/local-storage-constants.js');
const util = require('../../js/util/render-user-path.js');
const render_user_path = util.renderUserPath;
var ipcRenderer = require('electron').ipcRenderer;
const fs = require('fs');


let messageGroupName;
let contactGroupName;
let errorMessage;

async function getSelectors(){
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  // var admin = getServiceAccount();
  const selectorRef = await admin.firestore().collection('selectors').doc('selectors_list');
  const doc = await selectorRef.get()
  // alert(doc.exists);
  if (doc.exists){
    const selectorDetails = doc.data();
    admin.app().delete();
    return selectorDetails;
  }else{
    admin.app().delete();
    alert("Trouble in sending messages. Please check your internet connection!")
  }
}


async function setSelectorInCookies(selectorDetails){
  var d = {};
  var attachButtonSelector = selectorDetails.attach_button_selector;
  var documentSelector = selectorDetails.document_selector;
  var imageInputSelector = selectorDetails.image_input_selector;
  var inputSelector = selectorDetails.input_selector;
  var okTextSelector = selectorDetails.ok_text_selector;

  d["input-selector"] = inputSelector;
  d["attach-button-selector"] = attachButtonSelector;
  d["documents-selector"] = documentSelector;
  d["image-input-selector"] = imageInputSelector;
  d["ok-text-selector"] = okTextSelector;


  const jsonSelectorData = JSON.stringify(d);
  
  const cookieSelectorData = {
    url: 'https://whatsallsoftware.com',
    name: 'selectors',
    value: jsonSelectorData,
    expirationDate: Date.now() + (365 * 24 * 60 * 60)
  };

  try{
    
    const result = await ipcRenderer.invoke('set-cookies', cookieSelectorData);
    // alert(result);
    return true;
  }catch{
    return false;
  }
}


async function getSelectorFromCookies(selector){
  const result = await ipcRenderer.invoke('get-cookies', "selectors");
  var parsedSelectorDetails = JSON.parse(result);
  const selectorValue = parsedSelectorDetails[selector];
  return selectorValue
}


async function start(contactData, messageData){

  var selectorDetails = await getSelectors();
  var selectorInCookies = await setSelectorInCookies(selectorDetails);

  if (selectorInCookies){
    // var browser_details = await launchWhatsapp();
    const progressBar = ipcRenderer.invoke('progress', "cookieSelectorData");
    var signedIn = await launchWhatsapp();
    // var signedIn = true;
    if (signedIn){
      const userPath = await render_user_path();
      const chromebrowserUserDataPath = userPath + "/chromiumbrowser";
      var chromium_path = chromium.path + "";
      var chromium_path = chromium_path.replace('app.asar', 'app.asar.unpacked');
      // var chromium_path = "C:/Program Files/Google/Chrome/Application/chrome.exe"
      console.log(chromium_path);
      var browser = await puppeteer.launch({
        executablePath: chromium_path,
        headless: true, // set to false to see the browser window
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // required for Docker
        userDataDir: chromebrowserUserDataPath

      });
      var page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
      await triggerMessagingOnWhatsapp(page, contactData, messageData);
      browser.close();
      fs.rm(chromebrowserUserDataPath+"/", { recursive: true });
    }else{
      await ipcRenderer.invoke('update_progress', {'value':100, 'text':"Whatsall",  'detail':'Browser closed before signing in...'});
    }

  }else{
    // Sample way to initialize and set value in progress bar. Once progress bar code is completed, remove the below code.
    // const progressBar = ipcRenderer.invoke('progress', "cookieSelectorData");
    // console.log("setting now!!!")
    // await ipcRenderer.invoke('update_progress', {'value':1, 'text':"Test1",  'detail':'New Detail random'});
    // await sleep(2000);
    // await ipcRenderer.invoke('update_progress', {'value':10, 'text':"Test2"});
    // await sleep(2000);
    // await ipcRenderer.invoke('update_progress',  {'value':20, 'text':"Test1", 'detail':'New Detail'});
    alert("Troubling in messaging. Please contact whatsall team to get the trouble resolved.");
  }
}


async function triggerMessagingOnWhatsappForValidNumber(page, contactData, messageData, phoneNumber, i){
  
  var country_code = contactData["country_code"];
  var messages = messageData["messages_list"];
  var images = messageData["images_list"];
  var documents = messageData["documents_list"];
  messageGroupName = messageData["group_name"];
  contactGroupName = contactData["group_name"];

  var phone_number_with_country_code = country_code + phoneNumber;
  
  var authenticated = await authenticateIP();
  if (authenticated){
    if (contactData["additional_details"] != null){
      var additionalDetails = contactData["additional_details"][i];
      console.log(additionalDetails);
      await sendCustomizedMessage(phone_number_with_country_code, messages, additionalDetails, page);
    }else{
      await sendMessage(phone_number_with_country_code, messages, page);
    }
    await sendImage(phone_number_with_country_code, images, page);
    await sendDocuments(phone_number_with_country_code, documents, page);
  }else{
    alert("You are logged in from other device. Please log in and try again!");
  }
}

async function triggerMessagingOnWhatsapp(page, contactData, messageData){
  var contact_numbers = contactData["contact_list"];
  // 1 is added extra because we will show some progress once the setup is done.
  var totalProgressCalls = contact_numbers.length + 1;
  var totalProgressValue = 100/totalProgressCalls;
  await ipcRenderer.invoke('update_progress', {'value':totalProgressValue, 'text':"Setup Done",  'detail':'Starting messaging...'});
  for (var i=0; i<contact_numbers.length; i++){
    await ipcRenderer.invoke('update_progress', {'text':"Messaging Initiated",  'detail':'Messaging to '+contact_numbers[i]+'...'});
    await triggerMessagingOnWhatsappForValidNumber(page, contactData, messageData, contact_numbers[i], i);
    await ipcRenderer.invoke('update_progress', {'value':totalProgressValue,  'detail':'Message sent to '+contact_numbers[i]+'...'});
  }
}


async function constructDynamicMessage(message, additionalDetail){
  const template = Handlebars.compile(message);
  const dynamicMessage = template(additionalDetail);
  return dynamicMessage;
}



async function sendCustomizedMessage(phoneNumber, messages, additionalDetails, page){
  for(var i=0; i<messages.length; i++){
    if (messages[i]!=""){
      dynamicMessage = await constructDynamicMessage(messages[i], additionalDetails);
      await sendMessageOnWhatsappViaAutomation(phoneNumber, dynamicMessage, page);
    }
    
  }
}


async function sendMessage(phoneNumber, messages, page){
  for(var i=0; i<messages.length; i++){
    if (messages[i]!=""){
      await sendMessageOnWhatsappViaAutomation(phoneNumber, messages[i], page);
    }
  }
}


async function isInputBoxPresent(page){
  try{
    // const inputBoxSelector = 'footer [contenteditable]';
    var inputBoxSelectorFromCookies = await getSelectorFromCookies("input-selector");
    console.log("waiting for selector");
    await page.waitForSelector(inputBoxSelectorFromCookies);
    console.log("sleeping");
    await sleep(1500);
    console.log("send");
    return true;
  }catch(error){
    errorMessage = "Unexpected error when writing message"
    console.log(error);
    console.log("send failed");
    return false;
  }
}


async function isOkButtonPresent({page=null, phoneNumber=null, messages=null, imagePath=null, documentPath=null}){
  try{
    const okDivSelectorFromCookies = await getSelectorFromCookies("ok-text-selector")
    const linkHandlers = await page.$x(okDivSelectorFromCookies);
    console.log(linkHandlers.length);
    if (linkHandlers.length > 0){
      errorMessage = "Invalid Phone Number"
      await messagingData({phoneNumber:phoneNumber, message:messages, imagePath:imagePath, documentPath:documentPath, did_succeed:false, failureReason:"Invalid Phone Number"})
      return true;
    }
    console.log("Ok button not found!");
    return false;
  }catch(error){
    console.log(error);
    console.log("Ok button missing");
    return false;
  }
}



async function messagingData({phoneNumber=null,  didSucceed=false, failureReason="Unknown Failure", message=null, imagePath=null, documentPath=null}){
  const userPath = await render_user_path()
    const store = new Store({
      userDataPath: ""+userPath,
      configName: messagingReportConfigName,
      defaults: {
          report: []
      }
    });
    const current_time = Date();
    var current_report_data = await store.get('report');
    const reasonForFailure = didSucceed ? "None" : failureReason
    var new_data = {
      "phoneNumber":phoneNumber, 
      "messageGroupName":messageGroupName, 
      "contactGroupName":contactGroupName, 
      "time": current_time, 
      "didSucceed":didSucceed, 
      "failureReason":reasonForFailure, 
      "message": message,
      "imagePath": imagePath,
      "documentPath": documentPath
    }
    current_report_data.push(new_data);
    store.set('report', current_report_data);
    await setTotalMessagesSentCookie(current_report_data.length);
}


async function setTotalMessagesSentCookie(total_messages){
  var totalMessagesCount = {"total": total_messages}
  const jsonData = JSON.stringify(totalMessagesCount);

  const cookieTotalMessagesData = {
      url: 'https://whatsallsoftware.com',
      name: 'total_messages_count',
      value: jsonData,
      expirationDate: Date.now() + (365 * 24 * 60 * 60)
  };

  await ipcRenderer.invoke('set-cookies', cookieTotalMessagesData);
}


async function sendMessageOnWhatsappViaAutomation(phoneNumber, Message, page){

  var messages = Message.split("\n");

  await page.goto('https://web.whatsapp.com/send?phone='+phoneNumber+'&text&source&data&app_absent');
  var isNumberValid = await isInputBoxPresent(page);
  console.log("isNumberValid?");
  console.log(isNumberValid);
  if (isNumberValid){
    var didMessagingSucceed = await typeMessage(page, messages);
    await messagingData({phoneNumber:phoneNumber, message:Message, didSucceed:didMessagingSucceed});
    return true;
  }
  var isNumberInvalid = await isOkButtonPresent({page:page, phoneNumber:phoneNumber, message:Message});
  console.log("Is number invalid?");
  console.log(isNumberInvalid);
  if (!isNumberInvalid){
    var isNumberValidRetry = await isInputBoxPresent(page);
    if (isNumberValidRetry){
      var didMessagingSucceed = await typeMessage(page, messages);
      await messagingData({phoneNumber:phoneNumber, message:Message, didSucceed:didMessagingSucceed})
      return true;
    }
    await messagingData({phoneNumber:phoneNumber, message:Message, didSucceed:false});
  }
  return true; 
}


async function sendImageOnWhatsappViaAutomation(phoneNumber, imagePath, page){
  await page.goto('https://web.whatsapp.com/send?phone='+phoneNumber+'&text&source&data&app_absent');
  // await page.waitForSelector(inputSelector, { timeout: 0 });
  var isNumberValid = await isInputBoxPresent(page);
  if (isNumberValid){
    var didMessagingSucceed = await attachImage(page, imagePath);
    await messagingData({phoneNumber:phoneNumber, imagePath:imagePath, didSucceed:didMessagingSucceed});
    return true;
  }
  var isNumberInvalid = await isOkButtonPresent({page:page, phoneNumber:phoneNumber, imagePath:imagePath});
  if (!isNumberInvalid){
    var isNumberValidRetry = await isInputBoxPresent(page);
    if (isNumberValidRetry){
      var didMessagingSucceed = await attachImage(page, imagePath);
      await messagingData({phoneNumber:phoneNumber, imagePath:imagePath, didSucceed:didMessagingSucceed});
      return true;
    }
    await messagingData({phoneNumber:phoneNumber, imagePath:imagePath, didSucceed:false});
  }
  return true;
}


async function sendDocumentsOnWhatsappViaAutomation(phoneNumber, documentPath, page){
  await page.goto('https://web.whatsapp.com/send?phone='+phoneNumber+'&text&source&data&app_absent');
  // await page.waitForSelector(inputSelector, { timeout: 0 });
  var isNumberValid = await isInputBoxPresent(page);
  if (isNumberValid){
    var didMessagingSucceed = await attachDocument(page, documentPath);
    await messagingData({phoneNumber:phoneNumber, documentPath:documentPath, didSucceed:didMessagingSucceed});
    return true;
  }else{
    var isNumberInvalid = await isOkButtonPresent({page:page, phoneNumber:phoneNumber, documentPath:documentPath});
    if (!isNumberInvalid){
      var isNumberValidRetry = await isInputBoxPresent(page);
      if (isNumberValidRetry){
        var didMessagingSucceed = await attachDocument(page, documentPath);
        await messagingData({phoneNumber:phoneNumber, documentPath:documentPath, didSucceed:didMessagingSucceed});
        return true;
      }
      await messagingData({phoneNumber:phoneNumber, documentPath:documentPath, didSucceed:false});
    }
    return true;
  }
}

async function typeMessage(page, messages){
  // const inputSelector = 'footer [contenteditable]';

  try{
    
    var inputBoxSelectorFromCookies = await getSelectorFromCookies("input-selector");


    const inputField = await page.$(inputBoxSelectorFromCookies);
    await inputField.focus();

    for (var i=0; i<messages.length; i++){
      await page.keyboard.type(messages[i]);
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
    }
    await page.keyboard.press('Enter');
    await sleep(992);
    var initial_waiting_time = 200;
    try{
      for (var i=0; i<40; i++){
        await page.waitForSelector('span[aria-label=" Pending "]', { visible: true, timeout: 300 });
        console.log("Found");
        console.log("Pending sleep");
        await sleep(initial_waiting_time);
        initial_waiting_time = initial_waiting_time*1.1;
      }
      errorMessage = "Internet slow - Image sent was in Pending state for >120s"
      return false;
    }catch(error){
      return true;
    }
  }catch(error){
    console.log(error);
    return false;
  }
}


async function sendImage(phoneNumber, images, page){
  for (var i=0; i<images.length; i++){
    await sendImageOnWhatsappViaAutomation(phoneNumber, images[i], page);
  }

}



async function attachImage(page, imagePath){

  try{
    const attachButtonSelectorFromCookies = await getSelectorFromCookies("attach-button-selector");
    const imageInputSelectorFromCookies = await getSelectorFromCookies("image-input-selector");
    await sleep(1300);
    const attachBtn = await page.waitForXPath(attachButtonSelectorFromCookies);
    await attachBtn.click();
    await sleep(532);
    const imageBtn = await page.waitForXPath(imageInputSelectorFromCookies);
    await imageBtn.uploadFile(imagePath);
    await sleep(1261);
    await page.keyboard.press('Enter');
    await sleep(550);
    var initial_waiting_time = 200;
    try{
      for (var i=0; i<40; i++){
        await page.waitForSelector('span[aria-label=" Pending "]', { visible: true, timeout: 300 });
        console.log("Found");
        console.log("Pending sleep");
        await sleep(initial_waiting_time);
        initial_waiting_time = initial_waiting_time * 1.1
      }
      errorMessage = "Internet slow - Image sent was in Pending state for >120s"
      return false;
    }catch(error){
      return true;
    }
  }catch(error){
    errorMessage = "Trouble when attaching Image"
    console.log(error);
    return false;
  }
}


async function sendDocuments(phoneNumber, documents, page){
  for (var i=0; i<documents.length; i++){
    await sendDocumentsOnWhatsappViaAutomation(phoneNumber, documents[i], page);
    
    
  }
}





async function attachDocument(page, documentPath){
  try{
    
    const attachButtonSelectorFromCookies = await getSelectorFromCookies("attach-button-selector");
    const documentSelectorFromCookies = await getSelectorFromCookies("documents-selector");
    await ipcRenderer.invoke('update_progress', {'detail':'Contact number loaded. Attaching document now.'});
    await sleep(1300);
    const attachBtn = await page.waitForXPath(attachButtonSelectorFromCookies);
    await attachBtn.click();
    await sleep(532);
    const documentBtn = await page.waitForXPath(documentSelectorFromCookies);
    await documentBtn.uploadFile(documentPath);
    console.log("Enter press starting...")
    await sleep(1021);
    await page.keyboard.press('Enter');
    await ipcRenderer.invoke('update_progress', {'detail':'Document attached and sent on Whatsapp.\nWaiting for atleast single tick to appear.'});
    await sleep(643);
    var initial_waiting_time = 200;
    try{
      for (var i=0; i<40; i++){
        await page.waitForSelector('span[aria-label=" Pending "]', { visible: true, timeout: 300});
        console.log("Found");
        console.log("Pending sleep");
        await ipcRenderer.invoke('update_progress', {'detail':'Due to Internet speed / Document size, its taking more time for document to get sent.\n We will keep monitoring until atleast single tick appears.'});
        await sleep(initial_waiting_time);
        initial_waiting_time = initial_waiting_time * 1.1;
      }
      errorMessage = "Internet slow - Document sent was in Pending state for >120s"
      await ipcRenderer.invoke('update_progress', {'detail':'Internet was super slow. We could not send message.'});

      return false;
    }catch(err){
      return true;
    }
  }catch(err){
    errorMessage = "Trouble when attaching Document"
    console.log(err);
    return false;
  }
}


async function sleep(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}


async function signInIfRequired(){
  await ipcRenderer.invoke('update_progress', {'text':"Performing Initial Checks",  'detail':'Checking if SignIn is required...'});
  const userPath = await render_user_path();
  const chromebrowserUserDataPath = userPath + "/chromiumbrowser";
  chromium_path = chromium.path + "";
    chromium_path = chromium_path.replace('app.asar', 'app.asar.unpacked');
    console.log(chromium_path);
    const browser = await puppeteer.launch({
      executablePath: chromium_path,
      headless: true, // set to false to see the browser window
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // required for Docker
      userDataDir: chromebrowserUserDataPath
    });
    const page = await browser.newPage();
    await page.goto('https://web.whatsapp.com/');
    console.log("Browser opened...")
    // wait for the user to scan the QR code
    try{
      console.log("Checking if scan me canvas is present?")
      await page.waitForSelector('canvas[aria-label="Scan me!"]', { timeout: 10000 });
      await ipcRenderer.invoke('update_progress', {'detail':'Please sign in once the Whatsapp opens in browser...'});
      await sleep(2000);
      await browser.close();
      await launchWhatsapp();
    }catch(error){
      try{
        console.log(error);
        console.log("Checking if pane side is present?")
        await page.waitForSelector('#pane-side', { timeout: 20000 });
      }catch(error){
        console.log(error);
        await ipcRenderer.invoke('update_progress', {'detail':'Trouble in finding if you are signed in. Retriggering sign in process...'});
        await sleep(3031);
        await browser.close();
        await launchWhatsapp();
      }
    }
    await browser.close();

}


async function launchWhatsapp() {

  try{
    //https://stackoverflow.com/questions/62602604/puppeteer-fails-in-react-app-after-running-electron-builder
    const userPath = await render_user_path();
    const chromebrowserUserDataPath = userPath + "/chromiumbrowser"
    chromium_path = chromium.path + "";
    chromium_path = chromium_path.replace('app.asar', 'app.asar.unpacked');
    console.log(chromium_path);
    const browser = await puppeteer.launch({
      executablePath: chromium_path,
      headless: false, // set to false to see the browser window
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // required for Docker
      userDataDir: chromebrowserUserDataPath
    });
    // var browserJson = await ipcRenderer.invoke('start-browser', true);
    // var browser = await puppeteer.connect(JSON.parse(browserJson));
    // const browser = browser_list[0];
    const page = await browser.newPage();
    await page.goto('https://web.whatsapp.com/');
    // wait for the user to scan the QR code
    await page.waitForSelector('#pane-side', { timeout: 0 });
    await ipcRenderer.invoke('update_progress', {'detail':'SignIn successful...'});
    await sleep(542);
    // await ipcRenderer.invoke('exit-browser')
    browser.close();
    return true;
    // return [browser, page];
  }catch(error){
    console.log(error);
    return false;
  }
  return false;

  
}


module.exports = start;