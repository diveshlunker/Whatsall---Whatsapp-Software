// const Store = require('../../../js/db/local_storage.js')
// const util = require('../../../js/util/render-user-path.js');
// const render_user_path = util.renderUserPath;

// const {userMessageGroupsConfigName} = require('../../../js/constants/local-storage-constants.js')
// var ipcRenderer = require('electron').ipcRenderer;
// const {authenticateIP} = require('../../../js/auth/authentication-check-before-action.js');



function update_cookie(id){
  localStorage["message_group_id"] = id
}


/**
 * Returns message groups data from local storage
 * @returns {Array} message group details.
 */
async function getMessageDataFromDB(){
  const {userMessageGroupsConfigName} = require('../../../js/constants/local-storage-constants.js');
  const util = require('../../../js/util/render-user-path.js');
  const render_user_path = util.renderUserPath;
  const Store = require('../../../js/db/local_storage.js');


  const userPath = await render_user_path()
  const store = new Store({
    userDataPath: ""+userPath,
    configName: userMessageGroupsConfigName,
    defaults: {
        message_data: []
    }
  });
  var current_message_data = await store.get('message_data')
  return current_message_data;
}


async function setMessageDataInDB(message_data){
  const {userMessageGroupsConfigName} = require('../../../js/constants/local-storage-constants.js');
  const util = require('../../../js/util/render-user-path.js');
  const render_user_path = util.renderUserPath;
  const Store = require('../../../js/db/local_storage.js');

  const userPath = await render_user_path()
  const store = new Store({
    userDataPath: ""+userPath,
    configName: userMessageGroupsConfigName,
    defaults: {
        message_data: []
    }
  });
  await store.set('message_data', message_data)
}


async function getMessageGroupCurrentCountFromCookies(){
  var ipcRenderer = require('electron').ipcRenderer;

  const result = await ipcRenderer.invoke('get-cookies', "message_group");
    var parsedAuthDetails = JSON.parse(result);

    const total = parsedAuthDetails["total"];
    return total;
}


async function setMessageGroupCount(totalGroups){
  var ipcRenderer = require('electron').ipcRenderer;

  var messageGroupData = {"total": totalGroups}
    const jsonMessageGroupData = JSON.stringify(messageGroupData);

    const cookieMessageGroupData = {
        url: 'https://whatsallsoftware.com',
        name: 'message_group',
        value: jsonMessageGroupData,
        expirationDate: Date.now() + (365 * 24 * 60 * 60)
    };

    await ipcRenderer.invoke('set-cookies', cookieMessageGroupData);
    
}

async function decreaseMessageGroupCountInCookies(){
  const totalMessageGroups = await getMessageGroupCurrentCountFromCookies();
  await setMessageGroupCount(totalMessageGroups-1);

}


async function deleteID(id){

  message_group_details = await getMessageDataFromDB();
  new_message_group_data = []
  for (var i=0; i<message_group_details.length; i++){
    var id_of_message_group = message_group_details[i]["id"]
    if (id_of_message_group != id){
      new_message_group_data.push(message_group_details[i])
    }
  }
  setMessageDataInDB(new_message_group_data)
  document.location.reload();
}


async function getHTMLContentForMessageGroupCard(message_details){
  var string1 = '<div class="col-12 col-md-6"><div class="card"><div class="card-header"><h5 class="card-title mb-0">'
  var string3 = '</p></div><div class="card-body"> <a href="./message-form-edit.html" ';
  var string4 = 'class="btn btn-info">Edit</a> <button class="btn btn-danger" onClick="deleteID('
  var string5 = ')">Delete</button></div></div></div>'

  var string = "";

  var no_of_images = message_details["images_list"].length;
  var no_of_documents = message_details["documents_list"].length;
  var no_of_messages = message_details["no_of_messages"];
  var last_updated_at = message_details["last_updated_at"]

  var id = message_details["id"];

  string += string1;
  string += "Group - " + message_details["group_name"];
  string += '</h5><br><p class="card-text"> Total Messages - ' + no_of_messages;
  string += '<br> Total Images - ' + no_of_images;
  string += '<br> Total Documents - ' + no_of_documents;
  string += '<br><br> Last Updated At - ' + last_updated_at;
  string += string3;
  string += 'onClick="update_cookie('+id+')" ';
  string += string4;
  string += id;
  string += string5;

  return string;
}

async function get_existing_groups(){
  const {authenticateIP} = require('../../../js/auth/authentication-check-before-action.js');

  const auth = await authenticateIP();
  if (auth){
    message_group_details = await getMessageDataFromDB();
    html_content_for_all_groups = ""
    await setMessageGroupCount(message_group_details.length);
    for (var i=0; i<message_group_details.length; i++){
      html_content = await getHTMLContentForMessageGroupCard(message_group_details[i]);
      html_content_for_all_groups += html_content;
    }
    document.getElementById("group_rows").innerHTML = html_content_for_all_groups;
  }else{
    alert("You are signed in from other device. Please try again!");
  }
}


window.onload = get_existing_groups;