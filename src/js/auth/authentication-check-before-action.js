// const FirebaseAuth = require('./firebase_auth.js');
// const authenticate_user = FirebaseAuth.authenticate_user;
const admin = require('firebase-admin');
// const renderIPAddressOfSystem = require('../../js/util/render-ip-address.js');
const serviceAccount = require('../../support_files/firebase_auth.json');
// const os = require('os');
// var ipcRenderer = require('electron').ipcRenderer;



async function renderIPAddressOfSystem(){
    const os = require('os');

    // Get the network interfaces of the computer
    const interfaces = os.networkInterfaces();
    // Iterate through the network interfaces
    for (const iface of Object.values(interfaces)) {
        // Iterate through the addresses of the network interface
        for (const address of iface) {
            // Check if the address is an IPv4 address and not a loopback address
            if (address.family === 'IPv4' && !address.internal) {
                return(address.address)
            }else if (address.family === 'IPv6'  && !address.internal){
                return (address.address);
            }else{
                console.log("Error in getting IP!");
            }
        }
    }
}


async function getEmailFromCookiesData(){
    try{
        var ipcRenderer = require('electron').ipcRenderer;
        const result = await ipcRenderer.invoke('get-cookies', "auth_details");
        var parsedAuthDetails = JSON.parse(result);
        const email = parsedAuthDetails["email"];
        return email;
    }catch{
        return null;
    }
}

async function getLicenseFirestoreData(){
    var email = await getEmailFromCookiesData();
    var userData = await getUsersFirestoreData(email);
    var licenseKey = userData["license"];
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    
    const collectionRef = admin.firestore().collection('licenses');
    const doc = await collectionRef.doc(licenseKey);
    const docDetails = await doc.get();
    const docData = docDetails.data();
    admin.app().delete();
    return docData;
}


async function getUsersFirestoreData(email){
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    
    const collectionRef = admin.firestore().collection('users');
    const doc = await collectionRef.doc(email);
    const docDetails = await doc.get();
    const docData = docDetails.data();
    admin.app().delete();
    return docData;
}


async function authenticateIP(){
    var email = await getEmailFromCookiesData();
    var userData = await getUsersFirestoreData(email);
    var ipAddress = userData["ip"];
    var currentSystemsIPAddress = await renderIPAddressOfSystem();
    if(ipAddress == currentSystemsIPAddress){
        return true;
    }
    return false;
}


async function setValidityInCookie(validity){
    var ipcRenderer = require('electron').ipcRenderer;

    var auth_data = {"valid_until": validity}
    const jsonAuthData = JSON.stringify(auth_data);

    const cookieValidityData = {
        url: 'https://whatsallsoftware.com',
        name: 'license_validity_details',
        value: jsonAuthData,
        expirationDate: Date.now() + (365 * 24 * 60 * 60)
    };

    const result = await ipcRenderer.invoke('set-cookies', cookieValidityData);
}

async function hasLicenseExpired(){
    var licenseData = await getLicenseFirestoreData();
    console.log(licenseData);
    var validity = licenseData["valid_until"];
    await setValidityInCookie(validity);
    var currentDate = new Date();
    var validUntil = new Date(validity);
    if(validUntil.getTime() < currentDate.getTime()){
        return true;
    }else{
        return false;
    }
}


module.exports = {
    authenticateIP: authenticateIP,
    hasLicenseExpired: hasLicenseExpired
}