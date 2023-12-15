// const {messagingReportConfigName} = require('../../js/constants/local-storage-constants.js');
// const Store = require('../../js/db/local_storage.js')
// const loadWhatsapp = require('../../js/whatsapp_util/whatsapp-send-message-selected-from-usage-report.js');
// const {authenticateIP, hasLicenseExpired} = require('../../js/auth/authentication-check-before-action.js');

// const util = require('../../js/util/render-user-path.js');
// const render_user_path = util.renderUserPath;
var ipcRenderer = require('electron').ipcRenderer;

let reportData;


async function getReportDataFromDB(){
  const util = require('../../js/util/render-user-path.js');
  const Store = require('../../js/db/local_storage.js')

  const render_user_path = util.renderUserPath;

  const {messagingReportConfigName} = require('../../js/constants/local-storage-constants.js');

  const userPath = await render_user_path()
  const store = new Store({
    userDataPath: ""+userPath,
    configName: messagingReportConfigName,
    defaults: {
        report: []
    }
  });
  var current_report_data = await store.get('report');
  return current_report_data;
}


async function retryMessagingForSelectedItems(){
  const loadWhatsapp = require('../../js/whatsapp_util/whatsapp-send-message-selected-from-usage-report.js');

  ipcRenderer.invoke('progress', "cookieSelectorData");
  const table = document.getElementById('dashboard-table');
  const checkboxes = table.querySelectorAll('tbody input[type="checkbox"]:checked');
  var data = [];
  var validRows = [];
  checkboxes.forEach(function(checkbox) {
    const row = checkbox.parentNode.parentNode;
    const columns = row.querySelectorAll('td');
    // const rowData = {};
    //Id is present at 1st index.
    validRows.push(columns[1].innerText);
    // columns.forEach(function(column, index) {
    //   rowData['column' + (index + 1)] = column.innerText;
    // });
    // data.push(rowData);
  });
  var jsonData = [];
  // var reportData = await getReportDataFromDB();
  var length = reportData.length;
  console.log(validRows);
  for (var i=length-1; i>-1; i--){
    var sno = length-i;
    if (validRows.includes(sno.toString())){
      console.log(reportData[i]);
      jsonData.push(reportData[i]);
    }
  }
  console.log(jsonData);

  const {authenticateIP, hasLicenseExpired} = require('../../js/auth/authentication-check-before-action.js');

  var licenseExpired = await hasLicenseExpired();
  var authenticated = await authenticateIP();
  if(authenticated && !licenseExpired){
    await loadWhatsapp(jsonData);
  }else if (licenseExpired){
    alert("Your License has expiered. Please recharge.")
  }else{
    // TODO - Exit the software once ok is clicked in alert.
    alert("You are logged in from other device. Please log in and try again!")
  }
}


async function createRetryButton(){
  const button = document.createElement('button');
  
  const span = document.createElement('span');
  span.innerText = 'Retry';

  // create i element
  const i = document.createElement('i');
  i.setAttribute('data-feather', 'rotate-cw');

  // add i to span
  span.appendChild(i);

  // add span to button
  button.appendChild(span);

  button.classList.add('btn', 'btn-save-contact-group', 'btn-info');


  // add button click event listener
  button.addEventListener('click', async function() {
    await retryMessagingForSelectedItems();
  });

  // add button to the DOM
  const buttonContainer = document.getElementById('retry_button');
  buttonContainer.appendChild(button);
}


async function createTable(){
    
  // Create a new table element
  const table = document.createElement('table');
  table.id = "dashboard-table"

  // Add the Bootstrap classes to the table element
  table.classList.add('table', 'table-striped');

  // Create the table header row
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  const checkBoxHeader = document.createElement('th');
  const idHeader = document.createElement('th');
  const phoneNumberHeader = document.createElement('th');
  const messageGroupName = document.createElement('th');
  const contactGroupName = document.createElement('th');
  const statusHeader = document.createElement('th');
  const failureReasonHeader = document.createElement('th');
  const timeHeader = document.createElement('th');
  checkBoxHeader.textContent = '';
  idHeader.textContent = 'S.No'
  phoneNumberHeader.textContent = 'Phone Number';
  messageGroupName.textContent = 'Message Group Name';
  contactGroupName.textContent = 'Contact Group Name';
  statusHeader.textContent = 'Status';
  failureReasonHeader.textContent = 'Failure Reason(if any)';
  timeHeader.textContent = 'Message Sent at';
  tr.appendChild(checkBoxHeader);
  tr.appendChild(idHeader);
  tr.appendChild(phoneNumberHeader);
  tr.appendChild(contactGroupName);
  tr.appendChild(messageGroupName);
  tr.appendChild(statusHeader);
  tr.appendChild(failureReasonHeader);
  tr.appendChild(timeHeader);
  thead.appendChild(tr);

  reportData = await getReportDataFromDB();
  const length = reportData.length;

  if (length>0){
    await createRetryButton();
  }

  // Create the table body rows
  const tbody = document.createElement('tbody');
  var curI = 1;
  for (let i = length-1; i > -1; i--) {
    const tr = document.createElement('tr');
    const checkbox = document.createElement('td');
    const id = document.createElement('td');
    const phoneNumberDetail = document.createElement('td');
    const messageGroupNameDetail = document.createElement('td');
    const contactGroupNameDetail = document.createElement('td');
    const statusDetail = document.createElement('td');
    const failureReasonDetail = document.createElement('td');
    const timeDetail = document.createElement('td');

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'myCheckboxName';
    checkbox.appendChild(input);
    id.textContent = curI;
    curI+=1;
    phoneNumberDetail.textContent = reportData[i]["phoneNumber"];
    messageGroupNameDetail.textContent = reportData[i]["messageGroupName"];
    contactGroupNameDetail.textContent = reportData[i]["contactGroupName"];
    if (reportData[i]["didSucceed"]){
      const span = document.createElement('span');
      span.textContent = 'Success';
      span.classList.add('badge', 'bg-success');
      statusDetail.append(span);
      failureReasonDetail.textContent = "-"
    }
    else{
      const span = document.createElement('span');
      span.textContent = 'Failure';
      span.classList.add('badge', 'bg-danger');
      statusDetail.append(span);
      failureReasonDetail.textContent = reportData[i]["failureReason"];
    }
    const span = document.createElement('span');
    span.textContent = reportData[i]["time"];
    span.classList.add('badge', 'bg-info');
    timeDetail.append(span);

       // tr.addEventListener("mouseover", function(){
        if (reportData[i]["message"]){
          var content = reportData[i]["message"];
          // let newContent = content.replace(/\n/g, "<br>");
          messageGroupNameDetail.setAttribute('data-tooltip',content);
        }else if(reportData[i]["imagePath"]){
          messageGroupNameDetail.setAttribute('data-tooltip',reportData[i]["imagePath"]);
        }else if(reportData[i]["documentPath"]){
          messageGroupNameDetail.setAttribute('data-tooltip',reportData[i]["documentPath"]);
        }
        
    tr.appendChild(checkbox);
    tr.appendChild(id);
    tr.appendChild(phoneNumberDetail);
    tr.appendChild(contactGroupNameDetail);
    tr.appendChild(messageGroupNameDetail);
    tr.appendChild(statusDetail);
    tr.appendChild(failureReasonDetail);
    tr.appendChild(timeDetail);


 
    // });

    // tr.addEventListener("mouseout", function(){
    //   hidePopup();
    // });

    tbody.appendChild(tr);
  }

  // Add the header and body to the table element
  table.appendChild(thead);
  table.appendChild(tbody);

  // Add the table element to the specific element with class "my-table-container"
  const tableContainer = document.querySelector('.table-container');
  tableContainer.appendChild(table);

}


// Show popup with dynamic content
function showPopup(content) {
  var popup = document.getElementById("popup");
  var popupContent = document.getElementById("popupContent");

  popupContent.textContent = content;
  popup.classList.add("show");


}

// Hide popup
function hidePopup() {
  var popup = document.getElementById("popup");
  popup.classList.remove("show");

}


window.onload = createTable;