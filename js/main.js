/* ═══════════════════════════════════════════════
   WEDDING RSVP — main.js
═══════════════════════════════════════════════ */

// ── CONFIG — update these values ─────────────
const WEDDING_DATE = "2026-06-04T12:00:00"; // ISO format, local time
const API_URL = ""; // ← Paste your API Gateway URL here after Lambda setup
//   e.g. 'https://abc123.execute-api.ap-south-1.amazonaws.com/prod/rsvp'

// ── Page Loader ───────────────────────────────
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("siteLoader").classList.add("hidden");
  }, 800);
});

// ── Sticky Nav ────────────────────────────────
const mainNav = document.getElementById("mainNav");
window.addEventListener("scroll", () => {
  if (window.scrollY > 80) {
    mainNav.classList.add("scrolled");
  } else {
    mainNav.classList.remove("scrolled");
  }

  // Back to top
  const btt = document.getElementById("backToTop");
  if (window.scrollY > 400) {
    btt.classList.add("visible");
  } else {
    btt.classList.remove("visible");
  }
});

// ── Mobile Nav Toggle ─────────────────────────
const navToggle = document.getElementById("navToggle");
const navLinks = document.querySelector(".nav-links");
navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});
// Close on link click
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

// ── Countdown Timer ───────────────────────────
function updateCountdown() {
  const target = new Date(WEDDING_DATE).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    document.getElementById("cd-days").textContent = "00";
    document.getElementById("cd-hours").textContent = "00";
    document.getElementById("cd-mins").textContent = "00";
    document.getElementById("cd-secs").textContent = "00";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById("cd-days").textContent = String(days).padStart(
    2,
    "0",
  );
  document.getElementById("cd-hours").textContent = String(hours).padStart(
    2,
    "0",
  );
  document.getElementById("cd-mins").textContent = String(mins).padStart(
    2,
    "0",
  );
  document.getElementById("cd-secs").textContent = String(secs).padStart(
    2,
    "0",
  );
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ── Scroll Animations ─────────────────────────
const observerOptions = {
  threshold: 0.15,
  rootMargin: "0px 0px -40px 0px",
};
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // stagger children
      entry.target.style.transitionDelay = i * 0.08 + "s";
      entry.target.classList.add("in-view");
    }
  });
}, observerOptions);

document
  .querySelectorAll(".animate-on-scroll")
  .forEach((el) => observer.observe(el));

// ── Gallery Lightbox ──────────────────────────
// Inject simple lightbox HTML
const lightboxHTML = `
  <div class="lightbox-modal" id="lightbox">
    <button class="lightbox-close" id="lightboxClose">&times;</button>
    <img id="lightboxImg" src="" alt="Wedding photo">
  </div>`;
document.body.insertAdjacentHTML("beforeend", lightboxHTML);

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");

document.querySelectorAll(".gallery-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    lightboxImg.src = link.getAttribute("href");
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
  });
});

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "";
  lightboxImg.src = "";
}
lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

// ── Hide guests if declining ──────────────────
document
  .getElementById("rsvpAttendance")
  .addEventListener("change", function () {
    document.getElementById("guestsWrap").style.display =
      this.value === "no" ? "none" : "block";
  });

// ── RSVP Form Submission ──────────────────────
async function submitRSVP() {
  const name = document.getElementById("rsvpName").value.trim();
  const email = document.getElementById("rsvpEmail").value.trim();
  const phone = document.getElementById("rsvpPhone").value.trim();
  const attendance = document.getElementById("rsvpAttendance").value;
  const guests = document.getElementById("rsvpGuests").value;
  const event = document.getElementById("rsvpEvent").value;
  const diet = document.getElementById("rsvpDiet").value;
  const message = document.getElementById("rsvpMessage").value.trim();

  const errorEl = document.getElementById("rsvpError");
  errorEl.style.display = "none";

  // Basic validation
  if (!name) {
    showError("Please enter your name.");
    return;
  }
  if (!email || !email.includes("@")) {
    showError("Please enter a valid email address.");
    return;
  }
  if (!attendance) {
    showError("Please let us know if you will attend.");
    return;
  }
  if (!event) {
    showError("Please select which event(s) you will attend.");
    return;
  }

  const payload = {
    inviteCode: inviteCode, // ADD THIS LINE
    name,
    email,
    phone,
    attendance,
    guests: attendance === "no" ? 0 : parseInt(guests),
    event,
    diet,
    message,
  };

  // Show loading state
  document.getElementById("btnText").style.display = "none";
  document.getElementById("btnLoader").style.display = "inline";
  document.getElementById("rsvpSubmit").disabled = true;

  // If no API URL set, show demo success
  if (!API_URL) {
    setTimeout(() => showSuccess(attendance), 1200);
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showSuccess(attendance);
    } else {
      const data = await res.json().catch(() => ({}));
      showError(data.message || "Something went wrong. Please try again.");
      resetButton();
    }
  } catch (err) {
    console.error("RSVP error:", err);
    showError("Network error. Please check your connection and try again.");
    resetButton();
  }

  // ── DYNAMIC INVITATION LOGIC ──────────────────
  // 1. Grab the ?invite= parameter from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get("invite");

  // 2. Fetch the guest data
  async function fetchGuestData() {
    // If there's no code in the URL, just show the normal generic website
    if (!inviteCode) return;

    try {
      /* TODO: Once AWS is set up, uncomment this to call your real API Gateway
      const res = await fetch(`${API_URL}?code=${inviteCode}`);
      const data = await res.json();
    */

      // MOCK DATA for local testing right now:
      const data = {
        GuestName: "Honored Guest",
        Quote: "We can't wait to celebrate with you!",
      };

      // 3. Unhide the greeting container and inject the text
      const greetingContainer = document.getElementById(
        "personalized-greeting",
      );
      const nameDisplay = document.getElementById("guest-name");
      const quoteDisplay = document.getElementById("guest-quote");

      if (greetingContainer && nameDisplay && quoteDisplay) {
        greetingContainer.style.display = "block";
        nameDisplay.textContent = `Welcome, ${data.GuestName}`;
        quoteDisplay.textContent = data.Quote;
      }

      // 4. Auto-fill the RSVP form so they don't have to type their name
      const rsvpNameInput = document.getElementById("rsvpName");
      if (rsvpNameInput) {
        rsvpNameInput.value = data.GuestName;
        rsvpNameInput.readOnly = true; // Locks the field so they can't change it
      }
    } catch (error) {
      console.error("Error fetching guest data:", error);
    }
  }

  // Run this function immediately when the DOM is ready
  document.addEventListener("DOMContentLoaded", fetchGuestData);
}

function showSuccess(attendance) {
  document.getElementById("rsvpForm").style.display = "none";
  document.getElementById("rsvpSuccess").style.display = "block";

  const msg =
    attendance === "no"
      ? "Thank you for letting us know. We'll miss you!"
      : "We can't wait to celebrate with you! ✨";
  document.getElementById("successMsg").textContent = msg;
}

function showError(msg) {
  const errorEl = document.getElementById("rsvpError");
  errorEl.textContent = "⚠️ " + msg;
  errorEl.style.display = "block";
  resetButton();
}

function resetButton() {
  document.getElementById("btnText").style.display = "inline";
  document.getElementById("btnLoader").style.display = "none";
  document.getElementById("rsvpSubmit").disabled = false;
}

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      e.preventDefault();
      const navHeight = mainNav.offsetHeight;
      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    }
  });
});
