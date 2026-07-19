import "./firebase.js";
import { 
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

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

// =========================================================================
// ENFORCED SECURITY ORCHESTRATION WITH UI HANDLING
// =========================================================================

onAuthStateChanged(auth, async (user) => {

    if (user) {
        try {
            
                syncUserPresence(user);
          
        } catch (err) {
            console.error("Error inspecting user role attributes:", err);
        }
    } 
});


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