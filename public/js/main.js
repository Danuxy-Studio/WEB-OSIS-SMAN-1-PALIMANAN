// ===== DARK MODE =====
const themeToggle = document.getElementById("themeToggle");
const html = document.documentElement;
const body = document.body;

if (localStorage.getItem("theme") === "dark") {
    html.classList.add("dark-mode");
    body.classList.add("dark-mode");
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

themeToggle.addEventListener("click", () => {
    html.classList.toggle("dark-mode");
    body.classList.toggle("dark-mode");
    const isDark = html.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.innerHTML = isDark
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
});

// ===== HAMBURGER =====
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("open");
});

// Tutup menu saat link diklik (mobile)
document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("open");
    });
});

// ===== KONTAK (auto-hide success) =====
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("success") === "true") {
    alert("✅ Pesan berhasil dikirim!");
    window.history.replaceState({}, "", "/contact");
}
