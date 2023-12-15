// const path = require('path')
// var fs = require('fs');
// const XLSX = require("xlsx");
// var keys_list = [];

// const {userContactGroupsConfigName} = require('../../../js/constants/local-storage-constants.js')
// const util = require('../../../js/util/render-user-path.js');
// const render_user_path = util.renderUserPath;

// const Store = require('../../../js/db/local_storage.js');
// const { group } = require('console');



async function getDataFromDB(){
  const {userContactGroupsConfigName} = require('../../../js/constants/local-storage-constants.js');
  const util = require('../../../js/util/render-user-path.js');
  const render_user_path = util.renderUserPath;
  const Store = require('../../../js/db/local_storage.js');


  const userPath = await render_user_path()
    const store = new Store({
      userDataPath: ""+userPath,
      configName: userContactGroupsConfigName,
      defaults: {
          contact_data: [],
          archived_contact_data: []
      }
    });
    var contactGroupData = await store.get('contact_data')

    return contactGroupData
}


async function FillDefaultFormDetails(contactGroupData){
  
  var country_code = contactGroupData["country_code"];
  var group_name = contactGroupData["group_name"];

  var phone_number_string = ""
  for (var i=0; i<contactGroupData["contact_list"].length; i++){
    phone_number_string += contactGroupData["contact_list"][i]
    if (i!=(contactGroupData["contact_list"].length-1)){
      phone_number_string += "\n"
    }
  }


  document.getElementById("country-code").value = country_code;
  document.getElementById("group-name").value = group_name;
  document.getElementById("phone-numbers").value = phone_number_string;

}

async function updateFormForID(){
  var id = localStorage["contact_group_id"];
  var contactGroupData = await getDataFromDB();
  for (var i=0; i<contactGroupData.length; i++){
    if (contactGroupData[i]["id"] == id){
      if (contactGroupData[i]["manual"] == "true"){
        await FillDefaultFormDetails(contactGroupData[i])
      }else{
        alert("Cannot edit an excel file here. Please edit the file directly at: "+contactGroupData[i]["manual"]);
        window.history.back();
      }
    }
  }

}



async function getContactList() {
  var phone_numbers = document.getElementById("phone-numbers").value;
  var list_of_numbers = phone_numbers.split('\n');
  var contacts_list_tmp = [];
  var arrayLength = list_of_numbers.length;
  for (var i = 0; i < arrayLength; i++) {
      if (list_of_numbers[i].includes(",")){
        var numbers_tmp_list = list_of_numbers[i].split(",");
        for (var j=0;j<numbers_tmp_list.length;j++){
          var num = numbers_tmp_list[j].trim();
          contacts_list_tmp.push(num);
        }
      }
      else{
        var num = list_of_numbers[i].trim();
        contacts_list_tmp.push(num);
      }
  }
  return contacts_list_tmp
}

async function removeOldDataFromDB(id){
  const {userContactGroupsConfigName} = require('../../../js/constants/local-storage-constants.js');
  const util = require('../../../js/util/render-user-path.js');
  const render_user_path = util.renderUserPath;
  const Store = require('../../../js/db/local_storage.js');


  const userPath = await render_user_path();
  const store = new Store({
    userDataPath: ""+userPath,
    configName: userContactGroupsConfigName,
    defaults: {
        contact_data: [],
        archived_contact_data: []
    }
  });
  var current_contact_data = await store.get('contact_data')
  var contact_data_post_removal_of_id = []

  for (var i=0; i<current_contact_data.length; i++){
    if (current_contact_data[i]["id"]!=id){
      contact_data_post_removal_of_id.push(current_contact_data[i])
    }
  }

  await store.set('contact_data', contact_data_post_removal_of_id);
}


async function addDataInDB(id, country_code, contact_list, group_name, timestamp_to_locale_string){
  const {userContactGroupsConfigName} = require('../../../js/constants/local-storage-constants.js');
  const util = require('../../../js/util/render-user-path.js');
  const render_user_path = util.renderUserPath;
  const Store = require('../../../js/db/local_storage.js');


  const userPath = await render_user_path();
  const store = new Store({
    userDataPath: ""+userPath,
    configName: userContactGroupsConfigName,
    defaults: {
        contact_data: [],
        archived_contact_data: []
    }
  });
  var current_contact_data = store.get('contact_data');
  var new_data = {'id': id, 'country_code': country_code,  'contact_list': contact_list, 'additional_details': null, 'group_name':group_name, 'last_updated_at': timestamp_to_locale_string, 'manual': "true"}
  current_contact_data.push(new_data)
  await store.set('contact_data', current_contact_data)
}

async function updateDB(){
  var id = localStorage["contact_group_id"];
  var group_name = document.getElementById("group-name").value;
  var country_code = document.getElementById("country-code").value;
  const timestamp = new Date();
  const timestamp_to_locale_string = timestamp.toLocaleString();

  var updated_contact_list = await getContactList();
  await removeOldDataFromDB(id);

  await addDataInDB(id, country_code, updated_contact_list, group_name, timestamp_to_locale_string);
}

window.onload = updateFormForID;