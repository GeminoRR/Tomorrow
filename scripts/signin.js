/////////////////////
////// IMPORTS //////
/////////////////////
import { auth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, db, ref, set } from "./firebase.js";

///////////////////////
////// VARIABLES //////
///////////////////////
const login_pan = document.getElementById('login_pan');
const create_pan = document.getElementById('create_pan');
let pass_account_update = false;

///////////////////////////////
////// ALREADY CONNECTED //////
///////////////////////////////
onAuthStateChanged(auth, (user) => {
    if (user && !pass_account_update) {
        window.location.href = "app.html";
    }
});

////////////////////////////
////// CREATE ACCOUNT //////
////////////////////////////
const create_email = document.getElementById('create_email');
const create_password = document.getElementById('create_password');
const create_btn = document.getElementById('create_btn');

//Create a account
create_btn.addEventListener('click', ()=>{

    //Broken data
    if (create_email.value === ""){
        create_email.style.borderColor = "red";
        setTimeout(()=>{
            create_email.style.borderColor = "";
        }, 1200);
        return;
    }
    if (create_password.value === ""){
        create_password.style.borderColor = "red";
        setTimeout(()=>{
            create_password.style.borderColor = "";
        }, 1200);
        return;
    }

    //Create account
    pass_account_update = true;
    createUserWithEmailAndPassword(auth, create_email.value, create_password.value)
    .then((userCredential) => {
        // Signed in 
        set(ref(db, `users/${auth.currentUser.uid}`), {
            events: '[]',
            accent: '2C63DF',
            show_saturday: false,
            show_checked_tasks: false
        })
        .then(()=>{
            window.location.href = "app.html";
        });
    })
    .catch((error) => {
        // Error
        swal("Une erreur est survenu", error.message, "error");
        create_email.value = "";
        create_password.value = "";
    }); 

});

//Login
document.getElementById('create_pan_login').addEventListener('click', ()=>{
    create_pan.hidden = true;
    login_pan.hidden = false;
});

//Enter
create_email.addEventListener('keypress', (e)=>{
    if (e.key == "Enter"){
        create_password.focus();
    }
})
create_password.addEventListener('keypress', (e)=>{
    if (e.key == "Enter"){
        create_btn.click();
    }
})

///////////////////
////// LOGIN //////
///////////////////
const login_email = document.getElementById('login_email');
const login_password = document.getElementById('login_password');
const login_btn = document.getElementById('login_btn');

//Sign in
login_btn.addEventListener('click', ()=>{

    //Broken data
    if (login_email.value === ""){
        login_email.style.borderColor = "red";
        setTimeout(()=>{
            login_email.style.borderColor = "";
        }, 1200);
        return;
    }
    if (login_password.value === ""){
        login_password.style.borderColor = "red";
        setTimeout(()=>{
            login_password.style.borderColor = "";
        }, 1200);
        return;
    }

    //Create account
    signInWithEmailAndPassword(auth, login_email.value, login_password.value)
    .then((userCredential) => {
        // Signed in 
        window.location.href = "app.html";
    })
    .catch((error) => {
        // Error
        if (error.code === 'auth/invalid-email'){
            login_email.style.borderColor = "red";
            setTimeout(()=>{
                login_email.style.borderColor = "";
            }, 1200);
        } else if (error.code === 'auth/invalid-login-credentials'){
            login_email.style.borderColor = "red";
            setTimeout(()=>{
                login_email.style.borderColor = "";
            }, 1200);
            login_password.style.borderColor = "red";
            setTimeout(()=>{
                login_password.style.borderColor = "";
            }, 1200);
        } else {
            swal("Une erreur est survenu...", error.message, "error");
            login_email.value = "";
            login_password.value = "";
        }
    }); 

});

//Enter
login_email.addEventListener('keypress', (e)=>{
    if (e.key == "Enter"){
        login_password.focus();
    }
})
login_password.addEventListener('keypress', (e)=>{
    if (e.key == "Enter"){
        login_btn.click();
    }
})

//Create a account
document.getElementById('login_pan_create_account').addEventListener('click', ()=>{
    login_pan.hidden = true;
    create_pan.hidden = false;
});