// const {userMessageGroupsConfigName} = require('../../../js/constants/local-storage-constants.js')
// const util = require('../../../js/util/render-user-path.js');
// const render_user_path = util.renderUserPath;

// const Store = require('../../../js/db/local_storage.js');



async function getDataFromDB(){
  const util = require('../../../js/util/render-user-path.js');
  const render_user_path = util.renderUserPath;
  const {userMessageGroupsConfigName} = require('../../../js/constants/local-storage-constants.js');
  const Store = require('../../../js/db/local_storage.js');


  const userPath = await render_user_path()
    const store = new Store({
      userDataPath: ""+userPath,
      configName: userMessageGroupsConfigName,
      defaults: {
          message_data: [],
          archived_message_data: []
      }
    });
    var messageGroupData = await store.get('message_data')

    return messageGroupData
}



async function add_another_message(value="None"){
  var new_chq_no = parseInt($('#total_chq').val()) + 1;
  if(value!="None"){
    var new_input = '<textarea class="form-control" rows="3" id="phone-numbers_'+String(new_chq_no)+'">'+value+'</textarea></br>';
  }
  else{var new_input = '<textarea class="form-control" rows="3" placeholder="Message" id="phone-numbers_'+String(new_chq_no)+'"></textarea></br>';}
  
  $('#new-text-area').append(new_input);
  $('#total_chq').val(new_chq_no);
}

async function updateExistingDetailsInForm(){
  var id = localStorage["message_group_id"];
  var should_sent_alert = false;
  var message_group_details_list = await getDataFromDB();

  for (var i=0; i<message_group_details_list.length;i++){
    if(String(message_group_details_list[i]["id"])==String(id)){
      var group_name = message_group_details_list[i]["group_name"];
      document.getElementById("group-name").value = group_name;

      var details = message_group_details_list[i]["messages_list"]
      for (let i=0;i<details.length;i++){
        await add_another_message(details[i]);
      }

    }
  }

 
  

}


async function getMessagesList(){

  var no_of_text_messages = document.getElementById("total_chq").value;
  
  var messages_list = []
  for (let i=0;i<no_of_text_messages;i++){
    var id_pn = "phone-numbers_"+String(i+1);
    var message_temp = document.getElementById(id_pn).value;
    messages_list.push(message_temp);
  }

  return messages_list;
}


async function addMessagesToDB(messages_info){
  const util = require('../../../js/util/render-user-path.js');
  const render_user_path = util.renderUserPath; 
  const {userMessageGroupsConfigName} = require('../../../js/constants/local-storage-constants.js');
  const Store = require('../../../js/db/local_storage.js');


  const id = localStorage["message_group_id"];
  const timestamp = new Date();
  const timestamp_to_locale_string = timestamp.toLocaleString();
  var group_name = document.getElementById("group-name").value;
  
  var messages_list = messages_info;
  var no_of_message = messages_info.length;

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
  var tmp_message_data = [];
  var images_list = null;
  var documents_list = null;
  for (var i=0; i<current_message_data.length; i++){
    if (current_message_data[i]["id"] != id){
      tmp_message_data.push(current_message_data[i]);
    }
    else{
      var images_list = current_message_data[i]["images_list"];
      var documents_list = current_message_data[i]["documents_list"]
    }
  }
  var new_data = {'id': id, 'messages_list': messages_list,  'documents_list': documents_list, 'images_list': images_list, 'group_name':group_name, 'last_updated_at': timestamp_to_locale_string, 'no_of_messages': no_of_message}
  tmp_message_data.push(new_data)
  await store.set('message_data', tmp_message_data);
}


async function add_group_to_db(){
  var messages_list = await getMessagesList()
  await addMessagesToDB(messages_list);

}

window.onload = updateExistingDetailsInForm;