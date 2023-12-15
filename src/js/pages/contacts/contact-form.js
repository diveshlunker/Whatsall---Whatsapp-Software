// const {userContactGroupsConfigName} = require('../../../js/constants/local-storage-constants.js')
// const util = require('../../../js/util/render-user-path.js')
// const Store = require('../../../js/db/local_storage.js')

// const render_user_path = util.renderUserPath;

// const XLSX = require("xlsx");

function radio_check() {
  if(document.getElementById('manual').checked){
    document.getElementById("manual_form").style.display = 'block';
    document.getElementById("excel_form").style.display = 'none';

    const country_code = document.getElementById("country-code-excel");
    country_code.removeAttribute('required');
    const contact_file = document.getElementById("contact-file");
    contact_file.removeAttribute('required');
  }
  else{
    document.getElementById("manual_form").style.display = 'none';
    document.getElementById("excel_form").style.display = 'block';

    const country_code = document.getElementById("country-code");
    country_code.removeAttribute('required');
    const phone_numbers = document.getElementById("phone-numbers");
    phone_numbers.removeAttribute('required');
  }
}


async function readDataFromExcel(contact_file){
  const XLSX = require("xlsx");
  if(contact_file != "") {
    var workbook = XLSX.readFile(contact_file);
    let worksheets = {};
    var sheetName = workbook.SheetNames[0];
    worksheets[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const columnA = [];

    for (let z in worksheet) {
      if(z.toString()[0] === 'A'){
        columnA.push(worksheet[z].v);
      }
    }
    return [columnA, worksheets[sheetName]];

    }
}


async function getContactAddedManually(){
    var country_code = document.getElementById("country-code").value;
    var phone_numbers = document.getElementById("phone-numbers").value;
    var list_of_numbers = phone_numbers.split('\n');
    var contacts_list = [];
    var arrayLength = list_of_numbers.length;
    for (var i = 0; i < arrayLength; i++) {
        if (list_of_numbers[i].includes(",")){
          var numbers_tmp_list = list_of_numbers[i].split(",");
          for (var j=0;j<numbers_tmp_list.length;j++){
            var num = numbers_tmp_list[j].trim();
            contacts_list.push(num);
          }
        }
        else{
          var num = list_of_numbers[i].trim();
          contacts_list.push(num);
        }
    }
    return [country_code, contacts_list]
}


async function getContactsFromExcel(){
    var country_code = document.getElementById("country-code-excel").value;
    var contact_file = document.getElementById("contact-file").files[0].path;

    excel_data = await readDataFromExcel(contact_file);

    var contacts_list_tmp = excel_data[0];
    var contacts_list_without_header = contacts_list_tmp.slice(1,contacts_list_tmp.length);
    var full_details = excel_data[1];
    
    contact_list = []
    for (var i=0; i<contacts_list_without_header.length; i++){
        contact_list.push(contacts_list_without_header[i])
    }
    return [country_code, contact_list, full_details, contact_file]

}


async function getDataFromForm(){
    if(document.getElementById('manual').checked){
        var contactFormData = await getContactAddedManually()
        var country_code = contactFormData[0]
        var contact_list = contactFormData[1]
        var additional_details = null
        var isManual = "true"
    }
    else{
        var data = await getContactsFromExcel()
        var country_code = data[0]
        var contact_list = data[1]
        var additional_details = data[2]
        var isManual = data[3]
    }
    return [country_code, contact_list, additional_details, isManual]
}




async function addDataToDb(){
    const util = require('../../../js/util/render-user-path.js');
    const Store = require('../../../js/db/local_storage.js');
    const {userContactGroupsConfigName} = require('../../../js/constants/local-storage-constants.js');
    const render_user_path = util.renderUserPath;

    const id = String(Date.now());
    const timestamp = new Date();
    const timestamp_to_locale_string = timestamp.toLocaleString();
    var group_name = document.getElementById("group-name").value;
    var contactData = await getDataFromForm()
    contact_list = contactData[1]
    additional_details = contactData[2]
    isManual = contactData[3]
    country_code = contactData[0]

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
    var new_data = {'id': id, 'country_code': country_code,  'contact_list': contact_list, 'additional_details': additional_details, 'group_name':group_name, 'last_updated_at': timestamp_to_locale_string, 'manual': isManual}
    current_contact_data.push(new_data)
    store.set('contact_data', current_contact_data)

      
}