const { initializeApp } = require("firebase/app")
const {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} = require("firebase/auth")
const { contextBridge, ipcRenderer } = require('electron')


const firebaseConfig = {
    apiKey: "AIzaSyAYotnMIWJ2Bb_Yj7V6YYJfh7nvUdzjRW4",
    authDomain: "whatsall-e56cd.firebaseapp.com",
    projectId: "whatsall-e56cd",
    storageBucket: "whatsall-e56cd.appspot.com",
    messagingSenderId: "621594499759",
    appId: "1:621594499759:web:39c94e04c53f730002125a",
    measurementId: "G-TNF1ZNHX0X"
    };
    
    // Initialize Firebase
const app = initializeApp(firebaseConfig);
    

async function create_new_user(username, email, password){
    const auth = getAuth();
    try{
        const user_sign_up = await createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            alert("Signed in")
            const user = userCredential.user;
            return true
    
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert("Email is invalid or already registered.\nPlease try again.")
            return false
        });
        return user_sign_up
    }
    catch (error){
        alert(error)
        return false
    }
}

async function authenticate_user(email, password){
    const auth = getAuth();
    const user_sign_in = await signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        return true
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        alert("Incorrect email/password.")
        return false;
        
    });

    return user_sign_in;

}
    

module.exports = {
    create_new_user: create_new_user,
    authenticate_user: authenticate_user
}