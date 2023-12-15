// const path = require('path')
// var fs = require('fs');
// const XLSX = require("xlsx");
// const Store = require('../../../js/db/local_storage.js')
// const util = require('../../../js/util/render-user-path.js')
// const {userContactGroupsConfigName} = require('../../../js/constants/local-storage-constants.js')
// var ipcRenderer = require('electron').ipcRenderer;
// const {authenticateIP} = require('../../../js/auth/authentication-check-before-action.js');


// const render_user_path = util.renderUserPath;


function update_cookie(id){
  localStorage["contact_group_id"] = id
}


/**
 * Returns contact groups data from local storage
 * @returns {Array} Contact group details.
 */
async function getContactDataFromDB(){
  const {userContactGroupsConfigName} = require('../../../js/constants/local-storage-constants.js');
  const util = require('../../../js/util/render-user-path.js');
  const render_user_path = util.renderUserPath;
  const Store = require('../../../js/db/local_storage.js');


  const userPath = await render_user_path()
  const store = new Store({
    userDataPath: ""+userPath,
    configName: userContactGroupsConfigName,
    defaults: {
        contact_data: []
    }
  });
  var current_contact_data = await store.get('contact_data')
  return current_contact_data;
}


async function setContactDataInDB(contact_data){
  const {userContactGroupsConfigName} = require('../../../js/constants/local-storage-constants.js');
  const util = require('../../../js/util/render-user-path.js');
  const render_user_path = util.renderUserPath;
  const Store = require('../../../js/db/local_storage.js');

  const userPath = await render_user_path()
  const store = new Store({
    userDataPath: ""+userPath,
    configName: userContactGroupsConfigName,
    defaults: {
        contact_data: []
    }
  });
  await store.set('contact_data', contact_data)
}


async function getHTMLContentForContactGroupCard(contact_group_details){
  var string = ""
  var string1 = '<div class="col-12 col-md-6"><div class="card"><div class="card-header"><h5 class="card-title mb-0">'
  var string3 = '</p></div><div class="card-body"> <a href="./contact-form-edit.html" onClick="update_cookie(';
  var string4 = ')" class="btn btn-info">Edit</a> <button class="btn btn-danger" onClick="deleteID('
  var string5 = ')">Delete</button></div></div></div>'

  const total_contacts = contact_group_details['contact_list'].length;
  const group_name = contact_group_details["group_name"];
  const last_updated_at = contact_group_details["last_updated_at"];
  const id = contact_group_details["id"]

  string += string1;
  string += "Group - " + group_name;
  string += '</h5><br><p class="card-text"> Total Contacts - ' + total_contacts;
  string += '<br> Last Updated At - ' + last_updated_at;
  string += string3;
  string += id;
  string += string4;
  string += id;
  string += string5;

  
  console.log(string);

  return string;
}


async function get_existing_groups(){
  const {authenticateIP} = require('../../../js/auth/authentication-check-before-action.js');

  const authenticated = await authenticateIP();
  if(authenticated){
    contact_group_details = await getContactDataFromDB();
    html_content_for_all_groups = "";
    await setContactGroupCount(contact_group_details.length);
    for (var i=0; i<contact_group_details.length; i++){
      html_content = await getHTMLContentForContactGroupCard(contact_group_details[i])
      html_content_for_all_groups += html_content
    }
    document.getElementById("group_rows").innerHTML = html_content_for_all_groups;
  }else{
    alert("You are signed in other device. Please retry again!")
  }
}


async function getContactGroupCurrentCountFromCookies(){
  try{
    var ipcRenderer = require('electron').ipcRenderer;
    const result = await ipcRenderer.invoke('get-cookies', "contact_group");
    var parsedAuthDetails = JSON.parse(result);

    const total = parsedAuthDetails["total"];
    return total;
  }catch{
    return 0;
  }
}


async function setContactGroupCount(totalGroups){
  var ipcRenderer = require('electron').ipcRenderer;

  var contactGroupData = {"total": totalGroups}
    const jsonContactGroupData = JSON.stringify(contactGroupData);

    const cookieContactGroupData = {
        url: 'https://whatsallsoftware.com',
        name: 'contact_group',
        value: jsonContactGroupData,
        expirationDate: Date.now() + (365 * 24 * 60 * 60)
    };

    await ipcRenderer.invoke('set-cookies', cookieContactGroupData);
    
}

async function decreaseContactGroupCountInCookies(){
  const totalContactGroups = await getContactGroupCurrentCountFromCookies();
  await setContactGroupCount(totalContactGroups-1);
}

async function deleteID(id){

  contact_group_details = await getContactDataFromDB();
  new_contact_group_details = []
  for (var i=0; i<contact_group_details.length; i++){
    var id_of_contact_group = contact_group_details[i]["id"]
    if (id_of_contact_group != id){
      new_contact_group_details.push(contact_group_details[i])
    }
  }
  await setContactDataInDB(new_contact_group_details);
  await decreaseContactGroupCountInCookies();
  document.location.reload();
}


window.onload = get_existing_groups;