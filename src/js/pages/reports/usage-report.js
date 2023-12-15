const {messagingReportConfigName} = require('../../../js/constants/local-storage-constants.js');
const Store = require('../../../js/db/local_storage.js')

const util = require('../../../js/util/render-user-path.js');
const render_user_path = util.renderUserPath;



async function getReportDataFromDB(){
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




async function createTable(){
    
  // Create a new table element
  const table = document.createElement('table');

  // Add the Bootstrap classes to the table element
  table.classList.add('table', 'table-striped');

  // Create the table header row
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  const phoneNumberHeader = document.createElement('th');
  const messageGroupName = document.createElement('th');
  const contactGroupName = document.createElement('th');
  const statusHeader = document.createElement('th');
  const failureReasonHeader = document.createElement('th');
  const timeHeader = document.createElement('th');
  phoneNumberHeader.textContent = 'Phone Number';
  messageGroupName.textContent = 'Message Group Name';
  contactGroupName.textContent = 'Contact Group Name';
  statusHeader.textContent = 'Status';
  failureReasonHeader.textContent = 'Failure Reason(if any)';
  timeHeader.textContent = 'Message Sent at';
  tr.appendChild(phoneNumberHeader);
  tr.appendChild(contactGroupName);
  tr.appendChild(messageGroupName);
  tr.appendChild(statusHeader);
  tr.appendChild(failureReasonHeader);
  tr.appendChild(timeHeader);
  thead.appendChild(tr);

  var reportData = await getReportDataFromDB();
  const length = reportData.length;

  // Create the table body rows
  const tbody = document.createElement('tbody');
  for (let i = length-1; i > -1; i--) {
    const tr = document.createElement('tr');
    const phoneNumberDetail = document.createElement('td');
    const messageGroupNameDetail = document.createElement('td');
    const contactGroupNameDetail = document.createElement('td');
    const statusDetail = document.createElement('td');
    const failureReasonDetail = document.createElement('td');
    const timeDetail = document.createElement('td');

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

    tr.appendChild(phoneNumberDetail);
    tr.appendChild(contactGroupNameDetail);
    tr.appendChild(messageGroupNameDetail);
    tr.appendChild(statusDetail);
    tr.appendChild(failureReasonDetail);
    tr.appendChild(timeDetail);
    tbody.appendChild(tr);
  }

  // Add the header and body to the table element
  table.appendChild(thead);
  table.appendChild(tbody);

  // Add the table element to the specific element with class "my-table-container"
  const tableContainer = document.querySelector('.table-container');
  tableContainer.appendChild(table);

}


window.onload = createTable;