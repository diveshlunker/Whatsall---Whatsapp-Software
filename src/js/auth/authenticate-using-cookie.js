// const FirebaseAuth = require('../../js/auth/firebase_auth.js');
// const authenticate_user = FirebaseAuth.authenticate_user;
// const renderIPAddressOfSystem = require('../../js/util/render-ip-address.js');
// const serviceAccount = require('../../support_files/firebase_auth.json');
// const getServiceAccount = require('../db/firestore-admin.js');



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


async function modifyIPAddressForUser(email){
    const serviceAccount = require('../../support_files/firebase_auth.json');

    const admin = require('firebase-admin');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    // var admin = await getServiceAccount();
    const collectionRef = admin.firestore().collection('users');
    const doc = await collectionRef.doc(email);

    var getDoc = await doc.get();
    if(!getDoc.exists){
        admin.app().delete();
        return false;
    }else{
        const IPAddress = await renderIPAddressOfSystem();
        if(IPAddress){
            doc.update({
                ip: IPAddress
            });
            admin.app().delete();
            return true;
        }
        admin.app().delete();
        return false;
    }
}


async function signInUsingEmailAndPasswordFromCookieDetails(authDetails){
    const FirebaseAuth = require('../../js/auth/firebase_auth.js');
    const authenticate_user = FirebaseAuth.authenticate_user;
    if (authDetails){
      var parsedAuthDetails = JSON.parse(authDetails);
      const email = parsedAuthDetails["email"];
      const password = parsedAuthDetails["password"];
      const val = await authenticate_user(email, password);
  
      if (val){
          const modifyUser = await modifyIPAddressForUser(email);
          if(!modifyUser){
            return false;
          }
          return true;
      }else{
          return false;
      }
      
    }
    return false;
  }

  
module.exports = {
    signInUsingEmailAndPasswordFromCookieDetails: signInUsingEmailAndPasswordFromCookieDetails
}