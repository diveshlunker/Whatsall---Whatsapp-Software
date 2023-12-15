
// var ipcRenderer = require('electron').ipcRenderer;

// const FirebaseAuth = require('../../js/auth/firebase_auth.js');
// const authenticate_user = FirebaseAuth.authenticate_user;



async function signInUsingEmailAndPasswordFromCookieDetails(){
    try{
        
        const FirebaseAuth = require('../../js/auth/firebase_auth.js');
        const authenticate_user = FirebaseAuth.authenticate_user;
        var ipcRenderer = require('electron').ipcRenderer;

        const authDetails = await ipcRenderer.invoke('get-cookies', 'auth');    
        var parsedAuthDetails = JSON.parse(authDetails);
    
        const email = parsedAuthDetails["email"];
        const password = parsedAuthDetails["passowrd"];
    
        const val = await authenticate_user(email, password);
    
        if (val){
            return true;
        }else{
            alert("Could not auto login, Please login again!");
            return false;
        }
    }catch{
        return false;
    }
    

}


module.exports = {
    signInUsingEmailAndPasswordFromCookieDetails: signInUsingEmailAndPasswordFromCookieDetails
}