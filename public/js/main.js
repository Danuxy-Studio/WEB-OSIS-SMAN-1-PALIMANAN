/**
 * main.js — OSIS SMAN 1 Palimanan
 * Menggabungkan seluruh script yang sebelumnya diduplikasi inline
 * di banyak file .ejs (slider, hamburger, dark mode, lightbox, alert aspirasi)
 * jadi satu modul yang reusable & data-driven.
 */
(function () {
    "use strict";

    /* ============================================================
       THEME TOGGLE
       Default mengikuti prefers-color-scheme (auto, dari device).
       Tombol ini cuma dipakai kalau user mau override manual —
       pilihannya disimpan di localStorage lewat attribute
       data-theme pada <html> (lihat blocking script di header.ejs
       dan override CSS di style.css).
       ============================================================ */
    function initThemeToggle() {
        const themeToggle = document.getElementById("themeToggle");
        if (!themeToggle) return;

        const prefersDark = window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;

        function currentIsDark() {
            const attr = document.documentElement.getAttribute("data-theme");
            if (attr === "dark") return true;
            if (attr === "light") return false;
            return prefersDark;
        }

        function render() {
            const isDark = currentIsDark();
            themeToggle.innerHTML = isDark
                ? '<i class="fas fa-sun"></i> Mode Terang'
                : '<i class="fas fa-moon"></i> Mode Gelap';
        }

        render();

        themeToggle.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            const next = currentIsDark() ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            try {
                localStorage.setItem("theme", next);
            } catch (err) {
                /* localStorage tidak tersedia, abaikan */
            }
            render();
        });
    }

    /* ============================================================
       HAMBURGER NAV
       ============================================================ */
    function initHamburger() {
        const hamburger = document.getElementById("hamburger");
        const navLinks = document.getElementById("navLinks");
        if (!hamburger || !navLinks) return;

        hamburger.addEventListener("click", function (e) {
            e.stopPropagation();
            navLinks.classList.toggle("open");
        });

        document.querySelectorAll(".nav-links a").forEach(function (link) {
            link.addEventListener("click", function () {
                navLinks.classList.remove("open");
            });
        });

        document.addEventListener("click", function (e) {
            const isClickInside =
                navLinks.contains(e.target) || hamburger.contains(e.target);
            if (!isClickInside && navLinks.classList.contains("open")) {
                navLinks.classList.remove("open");
            }
        });

        window.addEventListener("scroll", function () {
            if (navLinks.classList.contains("open")) {
                navLinks.classList.remove("open");
            }
        });
    }

    /* ============================================================
       SLIDER GENERIK (auto-play + dots + swipe)
       Menggantikan 6 blok <script> identik (home, gema-sastra,
       nepal-festival, porak, mpls, diklat).

       Markup yang dibutuhkan:
       <div class="slider-wrapper">
         <div class="slider-container" data-slider data-autoplay="4000">
           <div class="slider-track">
             <div class="slider-slide">...</div>
           </div>
         </div>
       </div>
       <div class="slider-dots"></div>   <-- sibling dari slider-wrapper
       ============================================================ */
    function initSliders() {
        document.querySelectorAll("[data-slider]").forEach(function (container) {
            const track = container.querySelector(".slider-track");
            if (!track) return;

            const total = track.children.length;
            if (total === 0) return;

            const wrapper = container.closest(".slider-wrapper") || container.parentElement;
            const scope = wrapper && wrapper.parentElement ? wrapper.parentElement : document;
            const dotsContainer = scope.querySelector(".slider-dots");

            let currentIndex = 0;
            let autoPlayInterval;
            const autoPlayMs = parseInt(container.dataset.autoplay, 10) || 4000;

            function createDots() {
                if (!dotsContainer) return;
                dotsContainer.innerHTML = "";
                for (let i = 0; i < total; i++) {
                    const dot = document.createElement("span");
                    dot.className = "dot" + (i === 0 ? " active" : "");
                    dot.dataset.index = String(i);
                    dot.addEventListener("click", function () {
                        stopAutoPlay();
                        goToSlide(parseInt(this.dataset.index, 10));
                        startAutoPlay();
                    });
                    dotsContainer.appendChild(dot);
                }
            }

            function goToSlide(index) {
                if (index < 0) index = total - 1;
                if (index >= total) index = 0;
                currentIndex = index;
                track.style.transform = "translateX(-" + currentIndex * 100 + "%)";
                if (dotsContainer) {
                    dotsContainer.querySelectorAll(".dot").forEach(function (dot, i) {
                        dot.classList.toggle("active", i === currentIndex);
                    });
                }
            }

            function nextSlide() {
                goToSlide(currentIndex + 1);
            }

            function startAutoPlay() {
                if (total <= 1) return;
                stopAutoPlay();
                autoPlayInterval = setInterval(nextSlide, autoPlayMs);
            }

            function stopAutoPlay() {
                clearInterval(autoPlayInterval);
            }

            createDots();

            container.addEventListener("mouseenter", stopAutoPlay);
            container.addEventListener("mouseleave", startAutoPlay);

            let touchStartX = 0;
            let touchEndX = 0;

            container.addEventListener(
                "touchstart",
                function (e) {
                    touchStartX = e.changedTouches[0].screenX;
                },
                { passive: true }
            );

            container.addEventListener(
                "touchend",
                function (e) {
                    touchEndX = e.changedTouches[0].screenX;
                    const diff = touchStartX - touchEndX;
                    if (Math.abs(diff) > 50) {
                        stopAutoPlay();
                        goToSlide(currentIndex + (diff > 0 ? 1 : -1));
                        startAutoPlay();
                    }
                },
                { passive: true }
            );

            startAutoPlay();
        });
    }

    /* ============================================================
       LIGHTBOX GALERI
       Menggantikan script duplikat di gallery-detail.ejs & gallery-photos.ejs
       ============================================================ */
    function initLightbox() {
        document.querySelectorAll(".gallery-detail-item").forEach(function (item) {
            item.addEventListener("click", function () {
                const img = this.querySelector("img");
                if (!img) return;

                const overlay = document.createElement("div");
                overlay.className = "lightbox-overlay";

                const bigImg = document.createElement("img");
                bigImg.src = img.src;
                bigImg.className = "lightbox-img";

                overlay.appendChild(bigImg);
                overlay.addEventListener("click", function () {
                    this.remove();
                });

                document.body.appendChild(overlay);
            });
        });
    }

    /* ============================================================
       ALERT SUKSES ASPIRASI
       (dipicu redirect ?success=true dari POST /aspirasi di server.js)
       ============================================================ */
    function initAspirasiAlert() {
        const params = new URLSearchParams(window.location.search);
        if (params.get("success") === "true") {
            alert("✅ Aspirasi berhasil dikirim!");
            window.history.replaceState({}, "", window.location.pathname);
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        initThemeToggle();
        initHamburger();
        initSliders();
        initLightbox();
        initAspirasiAlert();
    });
})();
