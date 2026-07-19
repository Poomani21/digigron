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

let allUsersCache = []; 
let activeSnapshotListener = null; // Track the stream so we can clear it if needed

/**
 * Syncs the client's localized current location up to Firestore dynamically
 */
async function syncUserPresence(user) {
    if (!user) return;
    
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
        currentPage: location.pathname, 
        lastActive: serverTimestamp(),
        online: true
    }, { merge: true });
}

/**
 * Helper to process Firestore Timestamps or ISO inputs into professional view formats
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return "-";
    if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
}

/**
 * Repaints table layout mapping full collection definitions accurately
 */
function renderUsersTable(usersList) {
    const tbody = document.querySelector("#usersTable tbody");
    
    if (usersList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    No recorded user profiles found in registry.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usersList.map(user => {
        const currentStatus = user.online ? "Online" : "Offline";
        return `
            <tr>
                <td class="font-mono">${user.uid || "-"}</td>
                <td>${user.fullName || "-"}</td>
                <td>${user.email || "-"}</td>
                <td>${user.role || "User"}</td>
                <td class="font-mono">${user.currentPage || "-"}</td>
                <td>${formatTimestamp(user.lastActive)}</td>
                <td><span class="badge-status">${currentStatus}</span></td>
            </tr>
        `;
    }).join("");
}

/**
 * Handles initialization of the data pipeline only for verified admins
 */
function initializeAdminStream() {
    // Prevent duplicate listeners from stacking up
    if (activeSnapshotListener) return;

    const usersCollectionRef = collection(db, "users");
    
    activeSnapshotListener = onSnapshot(usersCollectionRef, (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
            users.push(doc.data());
        });
        
        allUsersCache = users; 
        renderUsersTable(users); 
    }, (error) => {
        console.error("Firestore stream error:", error);
        showAccessDenied("Database access denied. Check your Firestore security policies.");
    });
}

/**
 * Cleanly blocks the UI screen and alerts the viewer
 */
function showAccessDenied(message) {
    const tbody = document.querySelector("#usersTable tbody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #f87171; padding: 32px; font-weight: 600;">
                    ${message}
                </td>
            </tr>
        `;
    }
}

/**
 * Multi-profile deep matrix exporter targeting all metadata fields
 */
function exportTableToCSV() {
    if (allUsersCache.length === 0) {
        alert("No active data entries available to export.");
        return;
    }

    const headers = [
        "UID", "Full Name", "Email", "Role", "Current Page", 
        "Created At", "Last Login", "Last Active", "Online Status"
    ];
    
    const csvRows = allUsersCache.map(user => {
        return [
            user.uid || "",
            user.fullName || "",
            user.email || "",
            user.role || "User",
            user.currentPage || "",
            formatTimestamp(user.createdAt),
            formatTimestamp(user.lastLogin),
            formatTimestamp(user.lastActive),
            user.online ? "Online" : "Offline"
        ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    
    downloadLink.setAttribute("href", url);
    downloadLink.setAttribute("download", `comprehensive_users_export_${Date.now()}.csv`);
    downloadLink.style.visibility = "hidden";
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// =========================================================================
// ENFORCED SECURITY ORCHESTRATION
// =========================================================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // 1. Fetch the user's document directly to inspect their system role
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
                // User is verified as an admin -> authorize presence and start the global data stream
                syncUserPresence(user);
                initializeAdminStream();
            } else {
                // Authenticated, but missing correct permissions
                if (activeSnapshotListener) {
                    activeSnapshotListener(); // Disconnect listener
                    activeSnapshotListener = null;
                }
                allUsersCache = [];
                showAccessDenied("Access Denied: Administrative permissions required.");
            }
        } catch (err) {
            console.error("Error inspecting user role attributes:", err);
            showAccessDenied("Error validating security credentials.");
        }
    } else {
        // Disconnect streams and clear UI when completely logged out
        if (activeSnapshotListener) {
            activeSnapshotListener();
            activeSnapshotListener = null;
        }
        allUsersCache = [];
        showAccessDenied("Authentication Required: Please sign in to access this console.");
    }
});

document.getElementById("exportBtn").addEventListener("click", exportTableToCSV);

// Proactive background presence synchronization loop for active admin sessions
setInterval(() => {
    if (auth.currentUser) {
        // Double check state mapping to avoid executing unauthenticated pings
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        getDoc(userDocRef).then((snap) => {
            if (snap.exists() && snap.data().role === "admin") {
                syncUserPresence(auth.currentUser);
            }
        });
    }
}, 30000);