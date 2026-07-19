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
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore(); // Initialize Firestore database instance

const guest = document.getElementById("guest-links");
const user = document.getElementById("user-links");
const username = document.getElementById("user-name");


const profileBtn =
    document.getElementById("profileBtn");

const profileDropdown =
    document.getElementById("profileDropdown");

const logoutBtn =
    document.getElementById("logoutBtn");


onAuthStateChanged(auth, async (user) => { // ADDED: "async" keyword so we can use "await getDoc"

// onAuthStateChanged(auth, (user) => {

    const adminLink = document.getElementById("adminLink");

    if (user) {



        let name =
            user.displayName ||
            user.email.split("@")[0];



        document.getElementById("userName").textContent = name;


        document.getElementById("profileName").textContent = name;


        document.getElementById("profileEmail").textContent =
            user.email;



        // verified check

        if (user.emailVerified) {


            document.getElementById("verifyStatus").innerHTML =
                `
                <span class="verified">
                ✔ Verified Account
                </span>
                `;

        }
        else {


            //             document.getElementById("verifyStatus").innerHTML =
            //                 `
            // <span class="notverified">
            // ✖ Email Not Verified
            // </span>
            // `;
            document.getElementById("verifyStatus").innerHTML =
                `
                <span class="verified">
                ✔ Verified Account
                </span>
                `;

        }


        // Profile Image

        let photo = user.photoURL || "images/user.jpeg";


        document.getElementById("profilePhoto").src = photo;

        document.getElementById("profilePhoto2").src = photo;

        document.getElementById("navbar").style.setProperty("display", "block");
        document.getElementById("signInButton").style.setProperty("display", "none");


        // =========================================================================
        // CORRECTED: Safe structural role query implementation
        // =========================================================================
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data(); // Defines userData from Firestore

                // Enforced visibility condition matching your layout requirements
                if (userData.role === "admin") {
                    // Show the management link if verified as an admin
                    if (adminLink) adminLink.style.display = "block"; 
                } else {
                    // Hide the link if the profile role does not match
                    if (adminLink) adminLink.style.display = "none";
                }
            } else {
                // Hide link if user data doesn't exist in Firestore collection yet
                if (adminLink) adminLink.style.display = "none";
            }
        } catch (error) {
            console.error("Error reading administrative role permissions:", error);
            if (adminLink) adminLink.style.display = "none";
        }
        // =========================================================================

    }

    else {

        // User not logged in
        console.log("No user");

        document.getElementById("navbar").style.setProperty("display", "none");
        document.getElementById("signInButton").style.setProperty("display", "block");


        document.getElementById("loginBtn")?.style.setProperty("display", "block");
        document.getElementById("signupBtn")?.style.setProperty("display", "block");

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





if (profileBtn) {

    profileBtn.onclick = () => {


        profileDropdown.style.display =
            profileDropdown.style.display === "block"
                ? "none"
                : "block";


    };

}




logoutBtn.onclick = async () => {


    await signOut(auth);

    // window.location.href = "signup.html";
    window.location.href = "index.html";



};