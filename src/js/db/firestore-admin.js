const admin = require('firebase-admin');
const serviceAccount = require('../../support_files/firebase_auth.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function getServiceAccount(){
    return admin;
}

module.exports = getServiceAccount;