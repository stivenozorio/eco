(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector(".site-header");
  let ticking = false;
  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 40);
    ticking = false;
  };
  onScroll();
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );

  /* ---------- Mobile nav ---------- */
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  if (menuToggle && mainNav) {
    const setOpen = (open) => {
      mainNav.classList.toggle("is-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("nav-open", open);
      if (header) header.classList.toggle("is-solid", open);
    };
    menuToggle.addEventListener("click", () => setOpen(!mainNav.classList.contains("is-open")));
    mainNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mainNav.classList.contains("is-open")) {
        setOpen(false);
        menuToggle.focus();
      }
    });
    const desktopMq = window.matchMedia("(min-width: 1041px)");
    const onMq = (e) => {
      if (e.matches) setOpen(false);
    };
    if (desktopMq.addEventListener) desktopMq.addEventListener("change", onMq);
    else if (desktopMq.addListener) desktopMq.addListener(onMq);
  }

  /* ---------- Hero video ---------- */
  const video = document.querySelector(".hero-video");
  if (video) {
    const conn = navigator.connection || {};
    const saveData = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || "");
    const markPlaying = () => video.classList.add("is-playing");

    if (reduceMotion || saveData) {
      // Keep the poster frame only; don't download the video.
      video.removeAttribute("autoplay");
      video.querySelectorAll("source").forEach((s) => s.remove());
      video.load();
      markPlaying();
    } else {
      video.muted = true;
      video.addEventListener("playing", markPlaying, { once: true });
      const tryPlay = () => {
        const p = video.play();
        if (p && p.catch) p.catch(() => markPlaying());
      };
      if (video.readyState >= 2) tryPlay();
      else video.addEventListener("canplay", tryPlay, { once: true });

      // Pause when the hero is off-screen to save battery/CPU.
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) tryPlay();
            else video.pause();
          },
          { threshold: 0.05 }
        ).observe(video);
      }
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) video.pause();
        else if (video.getBoundingClientRect().bottom > 0) tryPlay();
      });
    }
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll("[data-reveal], [data-line], .process-step, .why-item");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Image parallax ---------- */
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
  if (parallaxEls.length && !reduceMotion) {
    const visible = new Set();
    const update = () => {
      const vh = window.innerHeight;
      visible.forEach((el) => {
        const rect = el.parentElement.getBoundingClientRect();
        const speed = parseFloat(el.dataset.parallax) || 0.12;
        // -1 (entering bottom) … 1 (leaving top)
        const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
        el.style.transform = `translate3d(0, ${(-progress * speed * 100).toFixed(2)}%, 0)`;
      });
      pTick = false;
    };
    let pTick = false;
    const request = () => {
      if (!pTick) {
        pTick = true;
        requestAnimationFrame(update);
      }
    };
    const pio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const el = e.target.querySelector("[data-parallax]") || e.target;
        if (e.isIntersecting) visible.add(el);
        else visible.delete(el);
      });
      request();
    });
    parallaxEls.forEach((el) => pio.observe(el.parentElement));
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
  }

  /* ---------- Gallery filter ---------- */
  const filterBar = document.querySelector(".filter-bar");
  const galleryItems = document.querySelectorAll("[data-category]");
  if (filterBar && galleryItems.length) {
    filterBar.addEventListener("click", (event) => {
      const btn = event.target.closest(".filter-btn");
      if (!btn) return;
      filterBar.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
      const filter = btn.dataset.filter;
      galleryItems.forEach((item) => {
        const show = filter === "all" || item.dataset.category === filter;
        item.hidden = !show;
        if (show) item.classList.add("is-visible");
      });
    });
  }

  /* ---------- Lightbox ---------- */
  const lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    const lightboxImg = lightbox.querySelector("img");
    const lightboxCap = lightbox.querySelector(".lightbox-cap");
    const closeBtn = lightbox.querySelector(".lightbox-close");
    const prevBtn = lightbox.querySelector(".lightbox-prev");
    const nextBtn = lightbox.querySelector(".lightbox-next");
    const figures = Array.from(document.querySelectorAll("[data-lightbox]"));
    let current = -1;
    let lastFocus = null;

    const show = (index) => {
      const figure = figures[index];
      if (!figure) return;
      current = index;
      const img = figure.querySelector("img");
      const caption = figure.querySelector("figcaption");
      lightboxImg.src = img.dataset.full || img.currentSrc || img.src;
      lightboxImg.alt = img.alt;
      lightboxCap.textContent = caption ? caption.textContent : "";
    };
    const visibleIndexes = () => figures.map((f, i) => (f.hidden ? -1 : i)).filter((i) => i >= 0);
    const step = (dir) => {
      const list = visibleIndexes();
      const pos = list.indexOf(current);
      show(list[(pos + dir + list.length) % list.length]);
    };
    const open = (index) => {
      lastFocus = document.activeElement;
      show(index);
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("nav-open");
      closeBtn.focus();
    };
    const close = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("nav-open");
      lightboxImg.removeAttribute("src");
      if (lastFocus) lastFocus.focus();
    };

    figures.forEach((figure, i) => {
      figure.setAttribute("tabindex", "0");
      figure.setAttribute("role", "button");
      figure.addEventListener("click", () => open(i));
      figure.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(i);
        }
      });
    });
    closeBtn.addEventListener("click", close);
    if (prevBtn) prevBtn.addEventListener("click", () => step(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => step(1));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  /* ---------- Estimate form ----------
     No server-side mail handler exists on the hosting yet, so the form
     composes an email to the business address in the visitor's mail app. */
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = document.getElementById("contact-form-status");
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      const data = new FormData(contactForm);
      const val = (k) => String(data.get(k) || "").trim();
      const subject = `Estimate request — ${val("project") || "Custom project"} — ${val("name")}`;
      const body = [
        `Name: ${val("name")}`,
        `Phone: ${val("phone") || "-"}`,
        `Email: ${val("email")}`,
        `Project: ${val("project") || "-"}`,
        "",
        val("message"),
      ].join("\n");
      window.location.href =
        "mailto:info@ecowoodworkdesigns.com?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);
      if (status) {
        status.textContent =
          "Your email app should open with your request ready to send. If it doesn't, email info@ecowoodworkdesigns.com or call (954) 326-8806.";
        status.className = "form-status is-success";
      }
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
