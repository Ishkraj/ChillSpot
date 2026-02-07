// ===============================
// BOOTSTRAP FORM VALIDATION
// ===============================
(function () {
  "use strict";

  var forms = document.querySelectorAll(".needs-validation");

  Array.prototype.slice.call(forms).forEach(function (form) {
    form.addEventListener(
      "submit",
      function (event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add("was-validated");
      },
      false
    );
  });
})();

// ===============================
// AFTER DOM LOAD
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  const desktopToggle = document.getElementById("themeToggle");
  const mobileToggle = document.getElementById("mobileThemeToggle");

  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  // ===============================
  // LOAD SAVED THEME
  // ===============================
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    if (desktopToggle) desktopToggle.textContent = "☀️";
  }

  // ===============================
  // THEME TOGGLE FUNCTION
  // ===============================
  function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "dark");
      if (desktopToggle) desktopToggle.textContent = "☀️";
    } else {
      localStorage.setItem("theme", "light");
      if (desktopToggle) desktopToggle.textContent = "🌙";
    }
  }

  // desktop toggle
  if (desktopToggle) {
    desktopToggle.addEventListener("click", toggleTheme);
  }

  // mobile toggle
  if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
      toggleTheme();
      if (mobileMenu) mobileMenu.style.display = "none";
    });
  }

  // ===============================
  // MOBILE MENU TOGGLE
  // ===============================
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      mobileMenu.style.display =
        mobileMenu.style.display === "block" ? "none" : "block";
    });

    // close on outside click
    document.addEventListener("click", (e) => {
      if (
        !mobileMenu.contains(e.target) &&
        !mobileMenuBtn.contains(e.target)
      ) {
        mobileMenu.style.display = "none";
      }
    });
  }

});

// ===============================
// RESERVATION PRICE CALCULATION
// ===============================
const checkIn = document.getElementById("checkIn");
const checkOut = document.getElementById("checkOut");
const totalPriceEl = document.getElementById("totalPrice");

if (checkIn && checkOut && totalPriceEl) {

  const pricePerNight = parseInt(
    document.querySelector(".reserve-box h5")?.innerText.replace(/[^\d]/g, "")
  );

  function calculateTotal() {
    if (!checkIn.value || !checkOut.value) return;

    const start = new Date(checkIn.value);
    const end = new Date(checkOut.value);

    const diffTime = end - start;
    const nights = diffTime / (1000 * 60 * 60 * 24);

    if (nights > 0) {
      totalPriceEl.innerText = "₹" + nights * pricePerNight;
    } else {
      totalPriceEl.innerText = "₹0";
    }
  }

  checkIn.addEventListener("change", calculateTotal);
  checkOut.addEventListener("change", calculateTotal);
}
// ===============================
// PROFILE DROPDOWN (MANUAL)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");

  if (profileBtn && profileMenu) {

    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.style.display =
        profileMenu.style.display === "block" ? "none" : "block";
    });

    // close on outside click
    document.addEventListener("click", () => {
      profileMenu.style.display = "none";
    });
  }
});
