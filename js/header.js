import { auth } from "./firebase.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


// ADDED: Import Firestore methods to fetch the user's document role attribute
import { 
    getFirestore, 
    doc, 
    getDoc,
    setDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore(); // Initialize Firestore database instance


const profileBtn =
    document.getElementById("profileBtn");

const profileDropdown =
    document.getElementById("profileDropdown");

const logoutBtn =
    document.getElementById("logoutBtn");

// Helper function to evaluate and toggle admin visibility safely
async function checkAdminVisibility(currentUser) {
    const adminLink = document.getElementById("adminLink");
    const contactUserLink = document.getElementById("contactUser");
    if (!adminLink || !currentUser) return;

    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // console.log("userData checked:", userData);
            if (userData.role === "admin") {
                adminLink.style.display = "block"; 
                contactUserLink.style.display = "block";
            } else {
                adminLink.style.display = "none";
                contactUserLink.style.display = "none";
            }
        } else {
            adminLink.style.display = "none";
            contactUserLink.style.display = "none";
        }
    } catch (error) {
        console.error("Error reading administrative role permissions:", error);
        adminLink.style.display = "none";
        contactUserLink.style.display = "none";
    }
}

onAuthStateChanged(auth, async (user) => { // ADDED: "async" keyword so we can use "await getDoc"

    const adminLink = document.getElementById("adminLink");
    const contactUserLink = document.getElementById("contactUser");

    if (user) {



        let name =
            user.displayName ||
            user.email.split("@")[0];



        document.getElementById("userName").textContent = name;


        document.getElementById("profileName").textContent = name;


        document.getElementById("profileEmail").textContent =
            user.email;

        document.getElementById("verifyStatus").innerHTML =
                `
                <span class="verified">
                ✔ Verified Account
                </span>
                `;

        // Profile Image

        let photo = user.photoURL || "images/user.jpeg";


        document.getElementById("profilePhoto").src = photo;

        document.getElementById("profilePhoto2").src = photo;

        document.getElementById("navbar").style.setProperty("display", "block");
        document.getElementById("signInButton").style.setProperty("display", "none");


        // =========================================================================
        // CORRECTED: Safe structural role query implementation
        // =========================================================================
        await checkAdminVisibility(user);
        // =========================================================================

        syncUserPresence(user);


    }

    else {

        // User not logged in
        // console.log("No user");

        document.getElementById("navbar").style.setProperty("display", "none");
        document.getElementById("signInButton").style.setProperty("display", "block");


        document.getElementById("loginBtn")?.style.setProperty("display", "block");
        document.getElementById("signupBtn")?.style.setProperty("display", "block");

        document.getElementById("profileDropdown")?.style.setProperty("display", "none");
        if (adminLink) adminLink.style.display = "none";
        if (contactUserLink) contactUserLink.style.display = "none";


        // // Protect pages
        // if(
        //     !location.pathname.includes("signup.html") &&
        //     !location.pathname.includes("signup.html")
        // ){
        //     window.location.href = "signup.html";
        // }
    }

});





if (profileBtn) {

    profileBtn.onclick = () => {


        profileDropdown.style.display =
            profileDropdown.style.display === "block"
                ? "none"
                : "block";


    };

}




// Logout function
logoutBtn.onclick = async () => {

    try {
        if (auth.currentUser) {
            await setDoc(doc(db, "users", auth.currentUser.uid), {
                online: false
            }, { merge: true });
        }
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout Error:", error);
    }

    // window.location.href = "signup.html";
    window.location.href = "index.html";



};

/**
 * Syncs the client's localized current location up to Firestore dynamically
 */

async function syncUserPresence(user) {
    if (!user) return;
    
    // Fallback to window.location.pathname explicitly to prevent context capture failures
    const path = window.location.pathname || "/";
    
    const userRef = doc(db, "users", user.uid);
    try {
        await setDoc(userRef, {
            uid: user.uid, // Explicitly keep the ID mapped
            currentPage: path, 
            lastActive: serverTimestamp(),
            online: true
        }, { merge: true });
    } catch (error) {
        console.error("Error syncing user presence:", error);
    }
}

// Proactive background presence synchronization loop for active admin sessions
setInterval(() => {
    if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        getDoc(userDocRef).then((snap) => {
            if (snap.exists() && snap.data().role === "admin") {
                syncUserPresence(auth.currentUser);
            }
        });
    }
}, 30000);