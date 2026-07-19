import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAYOzQ-pX-5pXBUnxyhDOn8xoJ5DUj2y6o",
    authDomain: "digigron-d8f6f.firebaseapp.com",
    projectId: "digigron-d8f6f",
    storageBucket: "digigron-d8f6f.firebasestorage.app",
    messagingSenderId: "643414873706",
    appId: "1:643414873706:web:ee78812678b40ea2021c13",
    measurementId: "G-5T87E1TS5H"
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
    if (!container) return;
    container.textContent = message;
    container.className = isSuccess ? 'status-msg success' : 'status-msg error';
}

// SIGN UP HANDLER WITH SPINNER IMPLEMENTATION
window.handleSignUp = async function (e) {
    e.preventDefault();
    
    // UI Elements
    const signUpBtn = document.getElementById('signup-btn');
    const signUpLoader = document.getElementById('signup-loader');
    const signUpBtnText = document.getElementById('signup-btn-text');
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        // 1. Activate loading state animation
        signUpBtn.disabled = true;
        signUpLoader.style.display = 'inline-block';
        signUpBtnText.textContent = 'Processing...';
        
        console.log("Creating auth user...");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Auth user created:", user.uid);

        console.log("Writing to Firestore...");
        // Wait completely for the database write to finish successfully
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            fullName: name,
            email: user.email,
            role: "user",
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            online: true,
            emailVerified: true
        });

        console.log("Firestore write successful");
        
        // Update auth profile name
        await updateProfile(user, { displayName: name });

        displayMessage('signin-msg', 'Account created successfully!', true);

        // Redirect to target index dashboard
        window.location.href = "index.html";

    } catch (error) {
        console.error("Signup Error:", error);
        displayMessage('signup-msg', error.message.replace('Firebase: ', ''));
        
        // 2. Clear loader state safely if registration fails
        signUpBtn.disabled = false;
        signUpLoader.style.display = 'none';
        signUpBtnText.textContent = 'Register';
    }
};

// SIGN IN HANDLER
window.handleSignIn = async function (e) {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            emailVerified: true,
            lastLogin: serverTimestamp(),
            online: true
        }, { merge: true });

        displayMessage('signin-msg', 'Access granted. Redirecting...', true);

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1200);

    } catch (error) {
        console.error("SignIn Error:", error);
        displayMessage('signin-msg', 'The email or password is incorrect.');   
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

// Check login status observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Logged in:", user.email);

        // FIX: Only auto-redirect if the user visits the page cold, NOT during form execution
        const isCurrentlySigningUp = document.getElementById('signup-card')?.classList.contains('active');
        const isCurrentlySigningIn = document.getElementById('signin-card')?.classList.contains('active');
        
        // If they are just loading the page and are already logged in, send them to index
        if (!isCurrentlySigningUp && !isCurrentlySigningIn && !location.pathname.includes("index.html")) {
            window.location.href = "index.html";
        }

        document.getElementById("loginBtn")?.style.setProperty("display", "none");
        document.getElementById("signupBtn")?.style.setProperty("display", "none");
        document.getElementById("profileDropdown")?.style.setProperty("display", "block");
    } else {
        console.log("No user session active");
        document.getElementById("loginBtn")?.style.setProperty("display", "block");
        document.getElementById("signupBtn")?.style.setProperty("display", "block");
        document.getElementById("profileDropdown")?.style.setProperty("display", "none");
    }
});

// Logout function
window.logoutUser = async function () {
    try {
        if (auth.currentUser) {
            await setDoc(doc(db, "users", auth.currentUser.uid), {
                online: false
            }, { merge: true });
        }
        await signOut(auth);
        window.location.href = "signup.html";
    } catch (error) {
        console.error("Logout Error:", error);
    }
};