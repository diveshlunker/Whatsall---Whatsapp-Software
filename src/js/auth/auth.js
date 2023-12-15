//Imports
// const Store = require('../../js/db/local_storage.js');
const FirebaseAuth = require('../../js/auth/firebase_auth.js');
// const util = require('../../js/util/render-user-path.js');
// var renderUserPath = util.renderUserPath;
// const {userAuthConfigName} = require('../../js/constants/local-storage-constants.js');
const admin = require('firebase-admin');
const serviceAccount = require('../../support_files/firebase_auth.json');
// var ipcRenderer = require('electron').ipcRenderer;


// const register_user = FirebaseAuth.create_new_user
// const authenticate_user = FirebaseAuth.authenticate_user
//Imports

const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");




async function checkIfValidLicense(licenseKey){    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    const db = admin.firestore();
    const collectionRef = db.collection('licenses');
    var check = 0;
    try{
        const documents = await collectionRef.listDocuments();

        documents.forEach((doc) => {
            if (doc.id == licenseKey){
                check = 1;
            }
        });
        admin.app().delete();

    } catch(error){
        alert("Failure in checking validity of licenses. Please try again after some time.");
        admin.app().delete();

    }
    return check;
}


async function getCurrentValidEmailsForLicense(license){
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    const db = admin.firestore();

    const licenseRef = db.collection('licenses').doc(license);
    const doc = await licenseRef.get();

    if(!doc.exists){
        console.log("No such documents");
        admin.app().delete();
    }else{
        const licenseDetails = doc.data();
        admin.app().delete();
        return licenseDetails;
    }

}


async function checkIfNewUserCanBeRegistered(licenseDetails){
    // var licenseDetails = await getCurrentValidEmailsForLicense(license);
    var check = 0;
    if (licenseDetails.emails.length < licenseDetails.total_users){
        check = 1;
    }else{
        alert("No new user could be registerd for the specified License.\nPlease increase your License capacity to signup.")
    }
    return check;
}


async function addUserInLicenseKeyList(license, email, licenseDetails){
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    const collectionRef = admin.firestore().collection('licenses');
    const docRef = collectionRef.doc(license);

    // var licenseDetails = await getCurrentValidEmailsForLicense(license);
    licenseDetails.emails.push(email);
    docRef.set(licenseDetails);
    admin.app().delete();

    
}

async function updateCookiesWithAuthDetails(email, password){
    var ipcRenderer = require('electron').ipcRenderer;

    var auth_data = {"email": email, "password": password}
    const jsonAuthData = JSON.stringify(auth_data);

    const cookieEmailData = {
        url: 'https://whatsallsoftware.com',
        name: 'auth_details',
        value: jsonAuthData,
        expirationDate: Date.now() + (365 * 24 * 60 * 60)
    };

    const result = await ipcRenderer.invoke('set-cookies', cookieEmailData);
    return result;
    
}


async function signupAndUpdateLocalDB(registeration_result){
    const Store = require('../../js/db/local_storage.js');

    const util = require('../../js/util/render-user-path.js');
    var renderUserPath = util.renderUserPath;
    const {userAuthConfigName} = require('../../js/constants/local-storage-constants.js');

    const userPath = await renderUserPath();
        const store = new Store({
            userDataPath: ""+userPath,
            configName: userAuthConfigName,
            defaults: {
                auth: false
            }
        })              
        store.set('auth',registeration_result); 
}


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
            }
        }
    }
}


async function updateUserDetailsInDB(email, license, licenseDetails, username, password){
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    var validity = licenseDetails.valid_until;
    var today = new Date();
    const specifiedDate = new Date(validity);
    const timeDiff = specifiedDate.getTime() - today.getTime();
    const total_valid_days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const collectionRef = admin.firestore().collection('users');
    const docRef = collectionRef.doc(email);
    const ipAddress = await renderIPAddressOfSystem();
    var user_details = {
        "ip":ipAddress,
        "logged_in": true,
        "total_valid_days": total_valid_days,
        "valid_until": validity,
        "license": license,
        "username": username,
        "password": password
    }

    await docRef.set(user_details);
    admin.app().delete();


}


async function sign_up(){
    const username = document.getElementById("signup-username").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const licenseKey = document.getElementById('signup-license').value;
    const validLicenseKey = await checkIfValidLicense(licenseKey);
    
    if (validLicenseKey == 1){
        var licenseDetails = await getCurrentValidEmailsForLicense(licenseKey);
        var registerNewUser = await checkIfNewUserCanBeRegistered(licenseDetails);
        // Handle cases of updating firebase in case of some failure in middle.
        if (registerNewUser == 1){
            const register_user = FirebaseAuth.create_new_user;

            const registeration_result = await register_user(username, email, password);
            if (registeration_result){
                await addUserInLicenseKeyList(licenseKey, email, licenseDetails);
                await signupAndUpdateLocalDB(registeration_result);
                await updateCookiesWithAuthDetails(email, password);
                await updateUserDetailsInDB(email, licenseKey, licenseDetails, username, password);
                await setValidityInCookie();

                window.location.replace("../../html/pages/home.html");
            }
        }
    }
    else{
        alert("Invalid License. Please enter Valid License Key. \n Please contact at +917358342651 for getting License.")
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


async function setValidityInCookie(){
    var ipcRenderer = require('electron').ipcRenderer;

    var licenseData = await getLicenseFirestoreData();
    console.log(licenseData);
    var validity = licenseData["valid_until"];
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


async function sign_in(){
    const Store = require('../../js/db/local_storage.js');
    const authenticate_user = FirebaseAuth.authenticate_user;

    const util = require('../../js/util/render-user-path.js');
    var renderUserPath = util.renderUserPath;

    const {userAuthConfigName} = require('../../js/constants/local-storage-constants.js');


    const email = document.getElementById("logemail").value;
    const password = document.getElementById("logpass").value;
    const val = await authenticate_user(email, password);
    // window.location.replace("../../html/pages/home.html")
    
    if (val){
        await updateCookiesWithAuthDetails(email, password);
        await setValidityInCookie();
        
        const userPath = await renderUserPath();
        const store = new Store({
            userDataPath: ""+userPath,
            configName: userAuthConfigName,
            defaults: {
                auth: false
            }
        })              
        store.set('auth',val)
        window.location.replace("../../html/pages/home.html");
    }
}

sign_up_btn.addEventListener('click', () =>{
    sign_up()
    
});

sign_in_btn.addEventListener('click', () =>{
    sign_in()
});

