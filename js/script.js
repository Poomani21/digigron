import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Initialize Firebase using your credentials
const firebaseConfig = {
  apiKey: "AIzaSyAYOzQ-pX-5pXBUnxyhDOn8xoJ5DUj2y6o",
  authDomain: "digigron-d8f6f.firebaseapp.com",
  projectId: "digigron-d8f6f",
  storageBucket: "digigron-d8f6f.firebasestorage.app",
  messagingSenderId: "643414873706",
  appId: "1:643414873706:web:ee78812678b40ea2021c13",
  measurementId: "G-5T87E1TS5H"
};

// Initialize Firebase App & Firestore
const app = initializeApp(firebaseConfig);
var db = getFirestore(app);


/* DigiGron site scripts — vanilla module. */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function init() {
  highlightActiveNav();
  wireMobileMenu();
  injectFooterYear();
  wireContactForm();
  wireReviews(db); // FIXED: Pass db here
  wireRevealOnScroll();
}

/* Active nav ------------------------------------------------------------- */
function highlightActiveNav() {
  var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("[data-nav-link]").forEach(function (a) {
    var href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path || (path === "" && href === "index.html")) {
      a.setAttribute("aria-current", "page");
    }
  });
}

/* Mobile menu ------------------------------------------------------------ */
function wireMobileMenu() {
  var btn = document.querySelector(".menu-btn");
  var panel = document.querySelector(".mobile-nav");
  if (!btn || !panel) return;
  var iconMenu = btn.querySelector(".icon-menu");
  var iconClose = btn.querySelector(".icon-close");

  btn.addEventListener("click", function () {
    var open = panel.classList.toggle("is-open");
    if (iconMenu && iconClose) {
      iconMenu.style.display = open ? "none" : "";
      iconClose.style.display = open ? "" : "none";
    }
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  panel.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      panel.classList.remove("is-open");
      if (iconMenu && iconClose) { iconMenu.style.display = ""; iconClose.style.display = "none"; }
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

/* Footer year ------------------------------------------------------------ */
function injectFooterYear() {
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = "2025";
}

/* Contact form — client-side submit -------------------------------------- */
function wireContactForm() {
  var form = document.querySelector("form[data-contact-form]");
  if (!form) return;

  var thanks = document.querySelector("[data-contact-thanks]");
  var submitBtn = document.getElementById("contact-submit-btn");
  var loader = document.getElementById("contact-loader");
  var btnText = document.getElementById("contact-btn-text");

  function setLoading(isLoading) {
    if (!submitBtn) return;
    if (isLoading) {
      submitBtn.disabled = true;
      if (loader) loader.style.display = "inline-block";
      if (btnText) btnText.textContent = "Submitting...";
    } else {
      submitBtn.disabled = false;
      if (loader) loader.style.display = "none";
      if (btnText) btnText.textContent = "Send inquiry →";
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Check reCAPTCHA
    var captchaResponse = grecaptcha.getResponse();
    if (!captchaResponse) {
      alert("Please verify that you are not a robot.");
      return;
    }
    // 1. Activate loading state animation
    setLoading(true);

    var data = new FormData(form);
    var services = [];

    form.querySelectorAll("input[type=checkbox]:checked").forEach(function (c) {
      services.push(c.value || c.name);
    });

    // Format local time zone (IST)
    var timestampString = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
      hour12: true
    });

    // Organize the payload object
    var payload = {
      name: data.get("name"),
      company: data.get("company") || "",
      email: data.get("email"),
      phone: data.get("phone"),
      budget: data.get("budget") || "",
      services: services, // Saved as an array in Firestore for better querying
      message: data.get("message"),
      submittedAt: serverTimestamp(), // Modular official database timestamp
      formattedTimeIST: timestampString
    };

    /* ---------- Step 1: Store in Firestore ---------- */
    addDoc(collection(db, "usercontect"), payload)
      .then(function(docRef) {
        // console.log("Document successfully written to Firestore with ID: ", docRef.id);

        /* ---------- Step 2: Send Email using EmailJS ---------- */
        var emailConfig = window.SITE_CONFIG.emailjs;
        if (emailConfig) {
          return emailjs.send(
            emailConfig.serviceId,
            emailConfig.templateId,
            {
              name: payload.name,
              company: payload.company,
              email: payload.email,
              phone: payload.phone,
              budget: payload.budget,
              services: services.join(", "), // Pass as string to EmailJS template
              message: payload.message,
              time: payload.formattedTimeIST,
              'g-recaptcha-response': captchaResponse
            },
            emailConfig.publicKey
          );
        }
      })
      .then(function () {
        // console.log("Email sent successfully");

        /* ---------- Step 3: Open WhatsApp ---------- */
        var lines = [
          "Name: " + payload.name,
          "Company: " + payload.company,
          "Email: " + payload.email,
          "Phone: " + payload.phone,
          "Budget: " + payload.budget,
          "Message: " + payload.message
        ];
        if (services.length) lines.push("Services: " + services.join(", "));
        
        var messageBody = lines.filter(Boolean).join("\n");
        var whatsapp = (window.SITE_CONFIG && window.SITE_CONFIG.contact && window.SITE_CONFIG.contact.whatsapp) || "";

        if (whatsapp) {
          var whatsappMessage = "New inquiry from DigiGron website\n\n" + messageBody;
          var whatsappURL = "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(whatsappMessage);
          window.open(whatsappURL, "_blank");
        }

        form.reset();

        // Reset loader UI state
        setLoading(false);

        // RESET reCAPTCHA HERE (Clears green tick mark)
        if (typeof grecaptcha !== "undefined" && grecaptcha.reset) {
          grecaptcha.reset();
        }
        
        // Reset form UI elements
        form.style.display = "none";
        if (thanks) {
          thanks.style.display = "block";
          // Countdown logic (6 to 1)
          var countdownSeconds = 6;
          var timerElement = thanks.querySelector("[data-countdown-timer]");

          if (timerElement) {
            timerElement.textContent = countdownSeconds;
          }
          var countdownInterval = setInterval(function () {
            countdownSeconds--;
            if (timerElement) {
              timerElement.textContent = countdownSeconds;
            }

            if (countdownSeconds <= 0) {
              clearInterval(countdownInterval);
              
              // Hide thanks section, show contact form again
              thanks.style.display = "none";
              form.style.display = "block";
            }
          }, 1000);
        }
      })
      .catch(function (error) {
        console.error("Error during submission pipeline:", error);
        alert("Sorry! Something went wrong while saving or sending your inquiry. Please try again.");
        // Clear loader state safely if submission fails
        setLoading(false);

        // Reset captcha on failure as well so the user can re-verify
        if (typeof grecaptcha !== "undefined" && grecaptcha.reset) {
          grecaptcha.reset();
        }
      });
  });
}

/* Reviews — Firestore-backed list ------------------------------------- */
function wireReviews(dbInstance) {
  // Use passed instance or fallback to top-level db
  var targetDb = dbInstance || db;

  var form = document.querySelector("form[data-review-form]");
  var list = document.querySelector("[data-review-list]");
  var empty = document.querySelector("[data-review-empty]");
  var count = document.querySelector("[data-review-count]");
  var submitBtn = document.getElementById("review-submit-btn");
  var loader = document.getElementById("review-loader");
  var btnText = document.getElementById("review-btn-text");

  if (!form || !list) return;

  var COLLECTION_NAME = "customer_reviews";
  var current = 5;
  var stars = form.querySelectorAll("[data-star]");

  function paintStars(n) {
    stars.forEach(function (btn, i) {
      var svg = btn.querySelector("svg");
      if (!svg) return;
      var on = i < n;
      svg.style.color = on ? "var(--primary)" : "var(--muted-foreground)";
      svg.style.fill = on ? "var(--primary)" : "none";
    });
  }

  stars.forEach(function (btn, i) {
    btn.addEventListener("mouseenter", function () { paintStars(i + 1); });
    btn.addEventListener("mouseleave", function () { paintStars(current); });
    btn.addEventListener("click", function () { current = i + 1; paintStars(current); });
  });
  paintStars(current);

  function setLoading(isLoading) {
    if (!submitBtn) return;
    if (isLoading) {
      submitBtn.disabled = true;
      if (loader) loader.style.display = "inline-block";
      if (btnText) btnText.textContent = "Publishing...";
    } else {
      submitBtn.disabled = false;
      if (loader) loader.style.display = "none";
      if (btnText) btnText.textContent = "Publish review";
    }
  }

  // Fetch reviews from Firestore
  async function loadAndRender() {
    try {
      var q = query(collection(targetDb, COLLECTION_NAME), orderBy("createdAt", "desc"));
      var querySnapshot = await getDocs(q);
      var items = [];

      querySnapshot.forEach(function (doc) {
        items.push({ id: doc.id, ...doc.data() });
      });

      render(items);
    } catch (e) {
      console.error("Error loading reviews from Firestore:", e);
    }
  }

  function render(items) {
    if (count) count.textContent = String(items.length) + " review" + (items.length === 1 ? "" : "s");
    
    if (!items.length) {
      if (empty) empty.style.display = "";
      list.innerHTML = "";
      list.style.display = "none";
      return;
    }

    if (empty) empty.style.display = "none";
    list.style.display = "";

    list.innerHTML = items.map(function (r) {
      var dateObj = r.createdAt && r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.date || Date.now());
      var date = dateObj.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
      
      var starsHtml = "";
      for (var i = 0; i < (r.rating || 5); i++) {
        starsHtml += '<svg xmlns="http://www.w3.org/2000/svg" class="size-4 fill-current" viewBox="0 0 24 24" stroke="currentColor" fill="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
      }

      return '<li class="rounded-2xl border border-border bg-surface/50 p-7 shadow-card">' +
        '<div class="flex items-center justify-between"><div class="flex gap-0.5 text-primary">' + starsHtml + '</div>' +
        '<time class="text-xs text-muted-foreground">' + escapeHtml(date) + '</time></div>' +
        '<blockquote class="mt-4 font-serif-display text-xl leading-snug text-balance" style="overflow-wrap:anywhere; word-break:break-word;">&ldquo;' + escapeHtml(r.text) + '&rdquo;</blockquote>' +
        '<div class="mt-5 pt-5 border-t border-border"><div class="font-display" style="overflow-wrap:anywhere; word-break:break-word;">' + escapeHtml(r.name) + '</div>' +
        (r.role ? '<div class="text-sm text-muted-foreground" style="overflow-wrap:anywhere; word-break:break-word;">' + escapeHtml(r.role) + '</div>' : '') +
        '</div></li>';
    }).join("");
  }

  // Handle Form Submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    var name = (form.querySelector("[name=name]").value || "").trim();
    var role = (form.querySelector("[name=role]").value || "").trim();
    var text = (form.querySelector("[name=text]").value || "").trim();

    if (!name || !text) return;

    setLoading(true);

    var reviewPayload = {
      name: name,
      role: role || "",
      rating: current,
      text: text,
      createdAt: serverTimestamp(),
      date: new Date().toISOString()
    };

    try {
      await addDoc(collection(targetDb, COLLECTION_NAME), reviewPayload);
      form.reset();
      current = 5;
      paintStars(current);
      await loadAndRender();
    } catch (error) {
      console.error("Error writing review to Firestore:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  });

  // Initial load
  loadAndRender();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

/* Reveal on scroll ------------------------------------------------------- */
function wireRevealOnScroll() {
  var els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
}