import "./firebase.js";
import { 
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

let allContactsCache = []; 
let filteredContactsCache = [];
let activeSnapshotListener = null;

/**
 * Helper to process Firestore Timestamps, formatted strings, or ISO inputs
 */
function formatSubmissionTime(contact) {
    if (contact.formattedTimeIST) {
        return contact.formattedTimeIST;
    }
    if (contact.submittedAt && contact.submittedAt.seconds) {
        return new Date(contact.submittedAt.seconds * 1000).toLocaleString();
    }
    if (contact.submittedAt) {
        return new Date(contact.submittedAt).toLocaleString();
    }
    return "-";
}

/**
 * Escapes special HTML characters to prevent XSS injection in raw input text
 */
function escapeHtml(text) {
    if (!text) return "";
    return String(text).replace(/[&<>"']/g, function (match) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[match];
    });
}

/**
 * Repaints table layout mapping the usercontect collection definitions accurately
 */
function renderContactsTable(contactsList) {
    const tbody = document.querySelector("#contactsTable tbody");
    if (!tbody) return;
    
    if (contactsList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted, #888); padding: 32px;">
                    No contact inquiries found matching criteria.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = contactsList.map(contact => {
        const servicesText = Array.isArray(contact.services) && contact.services.length > 0 
            ? contact.services.join(", ") 
            : "-";
        const formattedBudget = formatBudget(contact.budget);

        return `
            <tr>
                <td><strong>${escapeHtml(contact.name || "-")}</strong></td>
                <td>${escapeHtml(contact.email || "-")}</td>
                <td>${escapeHtml(contact.company || "-")}</td>
                <td>₹${escapeHtml(formattedBudget)}</td>
                <td class="font-mono">${escapeHtml(contact.phone || "-")}</td>
                <td>${escapeHtml(servicesText)}</td>
                <td>${formatSubmissionTime(contact)}</td>
            </tr>
        `;
    }).join("");
}

/**
 * Formats a budget input string/number with thousands separators (commas).
 * Example inputs: "123445" -> "1,234,45" (Indian/Standard) or formatted cleanly as a number.
 */
function formatBudget(value) {
    if (!value || value === "-") return "-";

    // Clean any non-numeric characters except decimals
    const numericValue = parseFloat(String(value).replace(/[^0-9.]/g, ""));

    // If it's not a valid number, return original text safely
    if (isNaN(numericValue)) return value;

    // Use Indian locale ('en-IN') for ₹ formatting (e.g., 10,000 or 1,23,445)
    // Or use 'en-US' for standard international format (e.g., 123,445)
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
    }).format(numericValue);
}

/**
 * Real-time dynamic search filter covering all user inquiry attributes
 */
function handleSearchFilter() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase().trim();

    if (!searchTerm) {
        filteredContactsCache = [...allContactsCache];
    } else {
        filteredContactsCache = allContactsCache.filter(contact => {
            const servicesStr = Array.isArray(contact.services) ? contact.services.join(" ") : "";
            const searchHaystack = [
                contact.name || "",
                contact.email || "",
                contact.company || "",
                contact.phone || "",
                contact.budget || "",
                contact.message || "",
                contact.formattedTimeIST || "",
                servicesStr
            ].join(" ").toLowerCase();

            return searchHaystack.includes(searchTerm);
        });
    }

    renderContactsTable(filteredContactsCache);
}

/**
 * Handles real-time listening of the usercontect collection only for verified admins
 */
function initializeAdminStream() {
    if (activeSnapshotListener) return;

    // Stream usercontect collection sorted by creation timestamp descending
    const contactsCollectionRef = collection(db, "usercontect");
    const q = query(contactsCollectionRef, orderBy("submittedAt", "desc"));
    
    activeSnapshotListener = onSnapshot(q, (snapshot) => {
        const contacts = [];
        snapshot.forEach((doc) => {
            contacts.push({ id: doc.id, ...doc.data() });
        });
        
        allContactsCache = contacts; 
        handleSearchFilter(); 
    }, (error) => {
        console.error("Firestore usercontect stream error:", error);
        showAccessDenied("Database access denied. Check your Firestore security policies.");
    });
}

/**
 * Cleanly blocks the UI screen and alerts the viewer
 */
function showAccessDenied(message) {
    const tbody = document.querySelector("#contactsTable tbody");
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
 * CSV Exporter targeting all metadata fields in the usercontect collection
 */
function exportTableToCSV() {
    if (filteredContactsCache.length === 0) {
        alert("No active contact entries available to export.");
        return;
    }

    const headers = [
        "Name", "Email", "Company", "Phone", "Budget", 
        "Services Interested", "Message", "Submitted At"
    ];
    
    const csvRows = filteredContactsCache.map(contact => {
    const servicesText = Array.isArray(contact.services) ? contact.services.join("; ") : "";
    const formattedBudget = formatBudget(contact.budget);
    // Add ₹ symbol to the budget if a valid formatted budget value exists
    const budgetWithSymbol = (formattedBudget && formattedBudget !== "-") 
            ? `₹${formattedBudget}` 
            : "-";
        
        return [
            contact.name || "",
            contact.email || "",
            contact.company || "",
            contact.phone || "",
            budgetWithSymbol || "",
            servicesText,
            contact.message || "",
            formatSubmissionTime(contact)
        ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    
    downloadLink.setAttribute("href", url);
    downloadLink.setAttribute("download", `digigron_inquiries_${Date.now()}.csv`);
    downloadLink.style.visibility = "hidden";
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// =========================================================================
// ENFORCED SECURITY ORCHESTRATION WITH UI HANDLING
// =========================================================================

onAuthStateChanged(auth, async (user) => {
    const exportBtn = document.getElementById("exportBtn");
    const searchInput = document.getElementById("searchInput");

    if (user) {
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
                // User is Admin -> Show controls and start data stream
                if (exportBtn) exportBtn.style.display = "inline-flex";
                if (searchInput) searchInput.disabled = false;
                
                initializeAdminStream();
            } else {
                // User is NOT Admin -> Disable controls and stop stream
                if (exportBtn) exportBtn.style.display = "none";
                if (searchInput) searchInput.disabled = true;
                if (activeSnapshotListener) {
                    activeSnapshotListener();
                    activeSnapshotListener = null;
                }
                allContactsCache = [];
                filteredContactsCache = [];
                showAccessDenied("Access Denied: Administrative permissions required.");
            }
        } catch (err) {
            console.error("Error inspecting user role attributes:", err);
            if (exportBtn) exportBtn.style.display = "none";
            showAccessDenied("Error validating security credentials.");
        }
    } else {
        // Not Logged In -> Disable controls and stop stream
        if (exportBtn) exportBtn.style.display = "none";
        if (searchInput) searchInput.disabled = true;
        if (activeSnapshotListener) {
            activeSnapshotListener();
            activeSnapshotListener = null;
        }
        allContactsCache = [];
        filteredContactsCache = [];
        showAccessDenied("Authentication Required: Please sign in to access this console.");
    }
});

// Event Listeners
document.getElementById("exportBtn")?.addEventListener("click", exportTableToCSV);
document.getElementById("searchInput")?.addEventListener("input", handleSearchFilter);