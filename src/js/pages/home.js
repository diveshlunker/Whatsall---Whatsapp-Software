// const {userContactGroupsConfigName, userMessageGroupsConfigName} = require('../../js/constants/local-storage-constants.js')
// const util = require('../../js/util/render-user-path.js')
const Store = require('../../js/db/local_storage.js')
// const loadWhatsapp = require('../../js/whatsapp_util/whatsapp-send-message.js');
// const {authenticateIP, hasLicenseExpired} = require('../../js/auth/authentication-check-before-action.js');
var ipcRenderer = require('electron').ipcRenderer;
// var renderUserPath = util.renderUserPath;
// const {userAuthConfigName} = require('../../js/constants/local-storage-constants.js');


const admin = require('firebase-admin');
const serviceAccount = require('../../support_files/firebase_auth.json');

// const render_user_path = util.renderUserPath;  


async function updateLocalDB(){
  const {userAuthConfigName} = require('../../js/constants/local-storage-constants.js');
  const util = require('../../js/util/render-user-path.js');
  var renderUserPath = util.renderUserPath;

  const userPath = await renderUserPath();
      const store = new Store({
          userDataPath: ""+userPath,
          configName: userAuthConfigName,
          defaults: {
              auth: false
          }
      })              
      store.set('auth',false); 
}


// async function deleteAuthCookie(){

// }


async function logOut(){
  await updateLocalDB();
  // await deleteAuthCookie();
  window.location.replace("../../html/auth/login_page.html");

}


async function send_messages(){
  
  var contact_groups_select_item = document.getElementById("contact-groups-select").value;
  var message_groups_select_item = document.getElementById("message-groups-select").value;

  contact_data = await getContactDataFromDB();
  message_data = await getMessageDataFromDB();
  m_d = null;
  c_d = null;
  const {authenticateIP, hasLicenseExpired} = require('../../js/auth/authentication-check-before-action.js');
  var licenseExpired = await hasLicenseExpired();
  var authenticated = await authenticateIP();
  if(authenticated && !licenseExpired){
    for (var i=0;i<message_data.length; i++){
      if (message_data[i]["group_name"] == message_groups_select_item){
        m_d = message_data[i]
      }
    }
  
    for (var i=0;i<contact_data.length; i++){
      if (contact_data[i]["group_name"] == contact_groups_select_item){
        c_d = contact_data[i]
      }
    }
  
    if (c_d==null | m_d==null){
      alert("Please select valid contact or message group before sending message.");
    }
    else{
      const loadWhatsapp = require('../../js/whatsapp_util/whatsapp-send-message.js');
      await loadWhatsapp(c_d, m_d);
    }  
  }else if (licenseExpired){
    alert("Your License has expiered. Please recharge.")
  }else{
    // TODO - Exit the software once ok is clicked in alert.
    alert("You are logged in from other device. Please log in and try again!")
  }
  
}


async function getMessageDataFromDB(){
  const {userMessageGroupsConfigName} = require('../../js/constants/local-storage-constants.js');
  const util = require('../../js/util/render-user-path.js');
  const render_user_path = util.renderUserPath;


  const userPath = await render_user_path()
  const store = new Store({
    userDataPath: ""+userPath,
    configName: userMessageGroupsConfigName,
    defaults: {
        message_data: [], 
        archived_message_data: []
    }
  });
  var current_message_data = await store.get('message_data')
  return current_message_data;
}


async function getContactDataFromDB(){
  const {userContactGroupsConfigName} = require('../../js/constants/local-storage-constants.js');
  
  const util = require('../../js/util/render-user-path.js');
  const render_user_path = util.renderUserPath;

  const userPath = await render_user_path()
  const store = new Store({
    userDataPath: ""+userPath,
    configName: userContactGroupsConfigName,
    defaults: {
        contact_data: [], 
        archived_contact_data: []
    }
  });
  var current_contact_data = await store.get('contact_data')
  return current_contact_data;

}


async function getNumberOfContactGroupsFromCookies(){
  const result = await ipcRenderer.invoke('get-cookies', "contact_group");
  var parsedAuthDetails = JSON.parse(result);
  try{
    const total = parsedAuthDetails["total"];
    return Math.max(total, 0);
  }catch{
    console.log("Error in getting contact data from cookies");
    return 0;
  }
}

async function getNumberOfMessageGroupsFromCookies(){
  try{
    const result = await ipcRenderer.invoke('get-cookies', "message_group");
    var parsedAuthDetails = JSON.parse(result);

    const total = parsedAuthDetails["total"];
    return Math.max(total, 0);
  }catch{
    return 0;
  }
}


async function getTotalMessagesSentFromCookies(){
  try{
    const result = await ipcRenderer.invoke('get-cookies', "total_messages_count");
    var parsedCookieDetails = JSON.parse(result);

    const total = parsedCookieDetails["total"];
    return Math.max(total, 0);
  }catch{
    return 0;
  }
}

async function getLicenseValidity(){
  try{
    const result = await ipcRenderer.invoke('get-cookies', "license_validity_details");
    var parsedAuthDetails = JSON.parse(result);
    const valid_until = parsedAuthDetails["valid_until"];
    return valid_until;
  }catch{
      return null;
  }
  // return 100;
}


async function getDashboardDetails(){
  const totalContactGroups = await getNumberOfContactGroupsFromCookies();
  const totalMessageGroups = await getNumberOfMessageGroupsFromCookies();
  const totalMessagesSent = await getTotalMessagesSentFromCookies();
  const LicenseValidity = await getLicenseValidity();

  return {"total_contact_groups": totalContactGroups, "total_message_groups":totalMessageGroups, "valid_until": LicenseValidity, "total_messages_sent": totalMessagesSent};
}

async function setDashboardDetails(cookie_details){
  var contactGroups = document.getElementById("total-contact-groups");
  contactGroups.textContent = ""+cookie_details["total_contact_groups"];

  var messageGroups = document.getElementById("total-message-groups");
  messageGroups.textContent = cookie_details["total_message_groups"];

  var totalMessagesSent = document.getElementById("total-messages-count");
  totalMessagesSent.textContent = cookie_details["total_messages_sent"];

  var licenseValidity = document.getElementById("license_validity");
  licenseValidity.textContent = cookie_details["valid_until"];
}


async function on_load_fn() {

  var contact_groups_select_list = document.getElementById("contact-groups-select");
  var message_groups_select_list = document.getElementById("message-groups-select");

  message_data = await getMessageDataFromDB();
  contact_data = await getContactDataFromDB();
  var cookie_details = await getDashboardDetails();
  await setDashboardDetails(cookie_details)

  for (var i=0;i<message_data.length; i++){
    var option = document.createElement("option");
    option.text = message_data[i]["group_name"];
    message_groups_select_list.add(option);
  }

  for(let i=0;i<contact_data.length;i++){
    var option = document.createElement("option");
    option.text = contact_data[i]["group_name"];
    contact_groups_select_list.add(option);
  }
  
}


window.onload = on_load_fn;