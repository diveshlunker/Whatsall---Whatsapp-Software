// const {userMessageGroupsConfigName} = require('../../../js/constants/local-storage-constants.js')
// const util = require('../../../js/util/render-user-path.js');
// const render_user_path = util.renderUserPath;

// const Store = require('../../../js/db/local_storage.js')



async function add_another_message(){
  var new_chq_no = parseInt($('#total_chq').val()) + 1;
  var new_input = '<textarea class="form-control" rows="3" id="phone-numbers_'+String(new_chq_no)+'" placeholder="Message - '+String(new_chq_no)+'"></textarea><br>';
  $('#new-text-area').append(new_input);
  $('#total_chq').val(new_chq_no);
}


async function getMessagesFromForm(){
  var no_of_text_messages = document.getElementById("total_chq").value;
  var messages_list = []
  for (let i=0;i<no_of_text_messages;i++){
    var id_pn = "phone-numbers_"+String(i+1);
    var message_temp = document.getElementById(id_pn).value;
    messages_list.push(message_temp);
  }

  if(messages_list.length==1 && messages_list[0]==""){
    var no_of_messages = 0;
  }
  else{var no_of_messages = no_of_text_messages;}

  return [messages_list, no_of_messages]
}

async function getDocumentsFromForm(){
  var documents = document.getElementById("document-file").files;
  var documents_list = [];
  var no_of_documents = documents.length;

  if(documents.length>0){
    for(let j=0;j<documents.length;j++){
      documents_list.push(documents[j].path);
    }
  }

  return [documents_list, no_of_documents];
}

async function getImagesFromForm(){
  var images = document.getElementById("images-file").files;

  var images_list = [];
  var no_of_images = images.length;
  if(images.length>0){

    for(let j=0;j<images.length;j++){
      images_list.push(images[j].path);
    }
  }

  return [images_list, no_of_images];
}


async function getDataFromForm(){
  
  var message = await getMessagesFromForm();
  var messages_list = message[0];
  var no_of_message = message[1];
  var documents = await getDocumentsFromForm();
  var documents_list = documents[0]
  var no_of_documents = documents[1]
  var images = await getImagesFromForm();
  var images_list = images[0]
  var no_of_images = images[1]
  
  var messages_dict={"messages_list":messages_list,"no_of_message":no_of_message, "documents_list":documents_list, "no_of_documents": no_of_documents, "images_list":images_list, "no_of_images":no_of_images};

  return messages_dict;
}



async function addMessagesToDB(messages_info){
  const {userMessageGroupsConfigName} = require('../../../js/constants/local-storage-constants.js');
  const util = require('../../../js/util/render-user-path.js');
  const render_user_path = util.renderUserPath;
  const Store = require('../../../js/db/local_storage.js');

  const id = String(Date.now());
  const timestamp = new Date();
  const timestamp_to_locale_string = timestamp.toLocaleString();
  var group_name = document.getElementById("group-name").value;
  
  var messages_list = messages_info["messages_list"];
  var images_list = messages_info["images_list"];
  var documents_list = messages_info["documents_list"];
  var no_of_message = messages_info["no_of_message"];

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
  var new_data = {'id': id, 'messages_list': messages_list,  'documents_list': documents_list, 'images_list': images_list, 'group_name':group_name, 'last_updated_at': timestamp_to_locale_string, 'no_of_messages': no_of_message}
  current_message_data.push(new_data)
  store.set('message_data', current_message_data);
}

async function add_group_to_db(){
  var message_dict = await getDataFromForm()
  await addMessagesToDB(message_dict);

}