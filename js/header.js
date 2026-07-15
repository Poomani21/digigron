import { auth } from "./firebase.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


const guest = document.getElementById("guest-links");
const user = document.getElementById("user-links");
const username = document.getElementById("user-name");


const profileBtn =
    document.getElementById("profileBtn");

const profileDropdown =
    document.getElementById("profileDropdown");

const logoutBtn =
    document.getElementById("logoutBtn");



onAuthStateChanged(auth, (user) => {


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


                            document.getElementById("verifyStatus").innerHTML =
                                `
                <span class="notverified">
                ✖ Email Not Verified
                </span>
                `;

        }


        // Profile Image

        let photo = user.photoURL || "images/user.jpeg";


        document.getElementById("profilePhoto").src = photo;

        document.getElementById("profilePhoto2").src = photo;

        document.getElementById("navbar").style.setProperty("display", "block");
        document.getElementById("signInButton").style.setProperty("display", "none");



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





if(profileBtn){

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