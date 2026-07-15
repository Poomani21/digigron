
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase Configuration (Configured to your project)
const firebaseConfig = {
    apiKey: "AIzaSyBBVvK-a5fxUlcr2fXhXoZ4RjB49iMpS6A",
    authDomain: "my-school-management-sys-c82e6.firebaseapp.com",
    projectId: "my-school-management-sys-c82e6",
    storageBucket: "my-school-management-sys-c82e6.firebasestorage.app",
    messagingSenderId: "712033170172",
    appId: "1:712033170172:web:1839d8d238b7ce08c85d79",
    measurementId: "G-7B4EPCVN26"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// View Switcher
window.switchCard = function (cardId) {
    document.querySelectorAll('.auth-card').forEach(card => card.classList.remove('active'));
    document.querySelectorAll('.status-msg').forEach(msg => {
        msg.textContent = '';
        msg.className = 'status-msg';
    });
    document.getElementById(cardId).classList.add('active');
};

// Status Message Helper
function displayMessage(elementId, message, isSuccess = false) {
    const container = document.getElementById(elementId);
    container.textContent = message;
    container.className = isSuccess ? 'status-msg success' : 'status-msg error';
}

// SIGN UP HANDLER (Creates user, saves unverified profile in DB, and prompts check inbox)
window.handleSignUp = async function (e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        // 1. Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Set Local Display Name Profile
        await updateProfile(user, { displayName: name });

        // 3. Save User metadata to firestore as UNVERIFIED (emailVerified: false)
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            fullName: name,
            email: email,
            createdAt: serverTimestamp(),
            emailVerified: false
        });

        // 4. Send the verification Email
        await sendEmailVerification(user);

        // Display success prompt, do NOT redirect to index.html yet
        displayMessage('signup-msg', 'Account pending verification! Please check your email inbox to verify your account.', true);
        document.getElementById('signup-form').reset();

        // Switch back to Sign In view after 4 seconds so they can login after verification
        setTimeout(() => {
            switchCard('signin-card');
            displayMessage('signin-msg', 'Please verify your email link first, then log in here.', true);
        }, 4000);

    } catch (error) {
        displayMessage('signup-msg', error.message.replace('Firebase: ', ''));
    }
};

// SIGN IN HANDLER (Blocks unverified users, Updates Firestore once verified, Redirects)
window.handleSignIn = async function (e) {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Explicit gateway check to see if email validation is complete
        if (!user.emailVerified) {
            displayMessage('signin-msg', 'Access Denied. You must click the verification link in your email inbox.');
            return;
        }

        // If they are verified, set database value to true and route inside index.html
        await setDoc(doc(db, "users", user.uid), {
            emailVerified: true
        }, { merge: true });

        displayMessage('signin-msg', 'Verification verified. Granting secure access...', true);

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        displayMessage('signin-msg', error.message.replace('Firebase: ', ''));
    }
};

// PASSWORD RECOVERY HANDLER
window.handlePasswordReset = async function (e) {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;

    try {
        await sendPasswordResetEmail(auth, email);
        displayMessage('reset-msg', 'Recovery options sent successfully!', true);
        document.getElementById('reset-form').reset();
    } catch (error) {
        displayMessage('reset-msg', error.message.replace('Firebase: ', ''));
    }
};

// Check login status
onAuthStateChanged(auth, (user) => {

    if (user) {
        // User logged in
        console.log("Logged in:", user.email);

         window.location.href = "index.html";

        document.getElementById("loginBtn")?.style.setProperty("display", "none");
        document.getElementById("signupBtn")?.style.setProperty("display", "none");

        document.getElementById("profileDropdown")?.style.setProperty("display", "block");
         document.getElementById("navbar").style.setProperty("display", "block");
                 document.getElementById("signInButton").style.setProperty("display", "none");


    } else {

        // User not logged in
        console.log("No user");
        document.getElementById("navbar").style.setProperty("display", "none");
        document.getElementById("loginBtn")?.style.setProperty("display", "block");
        document.getElementById("signupBtn")?.style.setProperty("display", "block");
        document.getElementById("signInButton").style.setProperty("display", "block");


        document.getElementById("profileDropdown")?.style.setProperty("display", "none");


        // // Protect pages
        // if(
        //     !location.pathname.includes("signup.html") &&
        //     !location.pathname.includes("signup.html")
        // ){
        //     window.location.href = "signup.html";
        // }
    }

});

// Logout function
window.logoutUser = function(){

    signOut(auth)
    .then(()=>{

        console.log("Logout success");

        window.location.href = "signup.html";

    })
    .catch((error)=>{
        console.log(error);
    });

}



