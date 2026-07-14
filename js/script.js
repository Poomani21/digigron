/* DigiGron site scripts — vanilla, no build step. */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    highlightActiveNav();
    wireMobileMenu();
    injectFooterYear();
    wireContactForm();
    wireReviews();
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

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var captchaResponse = grecaptcha.getResponse();

    if (!captchaResponse) {
        alert("Please verify that you are not a robot.");
        return;
    }

    var data = new FormData(form);

    var services = [];

    form.querySelectorAll("input[type=checkbox]:checked").forEach(function (c) {
      services.push(c.value || c.name);
    });

    var lines = [];

    ["name", "company", "email", "phone", "budget", "message"].forEach(function (k) {
      var v = data.get(k);
      if (v) {
        lines.push(k.charAt(0).toUpperCase() + k.slice(1) + ": " + v);
      }
    });

    if (services.length) {
      lines.push("Services: " + services.join(", "));
    }

    var messageBody = lines.join("\n");

    /* ---------- Send Email using EmailJS ---------- */

    var emailConfig = window.SITE_CONFIG.emailjs;

    if (emailConfig) {
      emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        {
          name: data.get("name"),
          company: data.get("company"),
          email: data.get("email"),
          phone: data.get("phone"),
          budget: data.get("budget"),
          services: services.join(", "),
          message: data.get("message"),
          // Converts ISO string to 12-hour Indian Standard Time (IST)
          time: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            dateStyle: "medium",
            timeStyle: "short",
            hour12: true
          }),
          'g-recaptcha-response': grecaptcha.getResponse()
        },
        emailConfig.publicKey
      )
      .then(function () {

        console.log("Email sent successfully");

        /* ---------- Open WhatsApp ---------- */

        var whatsapp =
          (window.SITE_CONFIG &&
            window.SITE_CONFIG.contact &&
            window.SITE_CONFIG.contact.whatsapp) || "";

        if (whatsapp) {

          var whatsappMessage =
            "New inquiry from DigiGron website\n\n" +
            messageBody;

          var whatsappURL =
            "https://wa.me/" +
            whatsapp +
            "?text=" +
            encodeURIComponent(whatsappMessage);

          window.open(whatsappURL, "_blank");
        }

        form.style.display = "none";

        if (thanks) {
          thanks.style.display = "block";
        }

        form.reset();

      })
      .catch(function (error) {
        console.error("EmailJS Error:", error);
        alert("Sorry! Failed to send your message. Please try again.");
      });
    }
  });
}

  /* Reviews — localStorage-backed list ------------------------------------- */
  function wireReviews() {
    var form = document.querySelector("form[data-review-form]");
    var list = document.querySelector("[data-review-list]");
    var empty = document.querySelector("[data-review-empty]");
    var count = document.querySelector("[data-review-count]");
    if (!form || !list) return;
    var KEY = "pulse_customer_reviews_v1";

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

    function load() {
      try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
    }
    function save(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); }

    function render() {
      var items = load();
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
        var date = new Date(r.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
        var starsHtml = "";
        for (var i = 0; i < r.rating; i++) {
          starsHtml += '<svg xmlns="http://www.w3.org/2000/svg" class="size-4 fill-current" viewBox="0 0 24 24" stroke="currentColor" fill="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        }
        return '<li class="rounded-2xl border border-border bg-surface/50 p-7 shadow-card">' +
          '<div class="flex items-center justify-between"><div class="flex gap-0.5 text-primary">' + starsHtml + '</div>' +
          '<time class="text-xs text-muted-foreground">' + escapeHtml(date) + '</time></div>' +
          '<blockquote class="mt-4 font-serif-display text-xl leading-snug text-balance">&ldquo;' + escapeHtml(r.text) + '&rdquo;</blockquote>' +
          '<div class="mt-5 pt-5 border-t border-border"><div class="font-display">' + escapeHtml(r.name) + '</div>' +
          (r.role ? '<div class="text-sm text-muted-foreground">' + escapeHtml(r.role) + '</div>' : '') +
          '</div></li>';
      }).join("");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = (form.querySelector("[name=name]").value || "").trim();
      var role = (form.querySelector("[name=role]").value || "").trim();
      var text = (form.querySelector("[name=text]").value || "").trim();
      if (!name || !text) return;
      var review = {
        id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
        name: name, role: role || undefined, rating: current, text: text,
        date: new Date().toISOString(),
      };
      var items = load(); items.unshift(review); save(items);
      form.reset(); current = 5; paintStars(current);
      render();
    });

    render();
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
})();
