(function () {
  "use strict";

  const STORAGE_KEY = "qiaomuyu-lang";
  const APP_STORE_URL = "https://apps.apple.com/us/app/moku-zen-tap-relax/id6774033552";
  const CONTACT_EMAIL = "duanwei@nonoor.com";

  const LANG_MAP = {
    "zh-cn": "zh-Hans",
    "zh-sg": "zh-Hans",
    "zh": "zh-Hans",
    "zh-tw": "zh-Hant",
    "zh-hk": "zh-HK",
    "zh-mo": "zh-HK",
    en: "en",
    ja: "ja",
    ko: "ko",
    th: "th"
  };

  function normalizeLang(raw) {
    if (!raw) return null;
    const key = raw.toLowerCase().replace("_", "-");
    if (WEBSITE_LOCALES[key]) return key;
    const base = key.split("-")[0];
    return LANG_MAP[key] || LANG_MAP[base] || null;
  }

  function detectLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && WEBSITE_LOCALES[saved]) return saved;

    const candidates = navigator.languages || [navigator.language];
    for (const candidate of candidates) {
      const matched = normalizeLang(candidate);
      if (matched) return matched;
    }
    return "zh-Hans";
  }

  let currentLang = detectLanguage();

  function t(key) {
    const pack = WEBSITE_LOCALES[currentLang] || WEBSITE_LOCALES["zh-Hans"];
    return pack[key] || WEBSITE_LOCALES.en[key] || key;
  }

  function setLanguage(lang) {
    if (!WEBSITE_LOCALES[lang]) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    applyTranslations();
    renderLangSwitcher();
    renderLegalContent();
    updateMeta();
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      let text = t(key);
      if (key === "footer_copyright") {
        text = text.replace("{year}", String(new Date().getFullYear()));
      }
      el.textContent = text;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });

    const appName = t("app_name");
    document.querySelectorAll(".brand-name").forEach((el) => {
      el.textContent = appName;
    });

    document.querySelectorAll(".nav-link").forEach((el) => {
      const page = el.dataset.page;
      if (!page) return;
      el.classList.toggle("is-active", isActivePage(page));
    });
  }

  function updateMeta() {
    const titleBase = t("app_name");
    const page = document.body.dataset.page;
    let title = titleBase;
    if (page === "privacy") title = `${t("legal_privacy_title")} · ${titleBase}`;
    if (page === "terms") title = `${t("legal_terms_title")} · ${titleBase}`;
    document.title = title;

    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("meta_description"));
  }

  function isActivePage(page) {
    const current = document.body.dataset.page || "home";
    return current === page;
  }

  function renderLangSwitcher() {
    const mount = document.getElementById("lang-switcher");
    if (!mount) return;

    mount.innerHTML = "";
    const label = document.createElement("span");
    label.className = "lang-label";
    label.textContent = t("lang_label");
    mount.appendChild(label);

    const select = document.createElement("select");
    select.className = "lang-select";
    select.setAttribute("aria-label", t("lang_label"));

    SUPPORTED_LANGS.forEach(({ code, label: langLabel }) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = langLabel;
      option.selected = code === currentLang;
      select.appendChild(option);
    });

    select.addEventListener("change", (e) => setLanguage(e.target.value));
    mount.appendChild(select);
  }

  function renderLegalContent() {
    const mount = document.getElementById("legal-body");
    if (!mount || !window.LEGAL_CONTENT) return;

    const page = document.body.dataset.page;
    const bucket = page === "privacy" ? "privacy" : page === "terms" ? "terms" : null;
    if (!bucket) return;

    const text = LEGAL_CONTENT[bucket][currentLang] || LEGAL_CONTENT[bucket]["en"] || "";
    mount.innerHTML = "";

    text.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        mount.appendChild(document.createElement("br"));
        return;
      }
      const p = document.createElement("p");
      p.textContent = trimmed;
      mount.appendChild(p);
    });
  }

  function setupMobileNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => nav.classList.remove("is-open"));
    });
  }

  function setupDownloadLinks() {
    document.querySelectorAll(".app-store-link").forEach((el) => {
      el.setAttribute("href", APP_STORE_URL);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    });

    document.querySelectorAll(".contact-link").forEach((el) => {
      el.setAttribute("href", `mailto:${CONTACT_EMAIL}`);
    });
  }

  function setupHeroCarousel() {
    const carousel = document.querySelector(".hero-carousel");
    if (!carousel) return;

    const track = carousel.querySelector(".hero-carousel-track");
    const slides = carousel.querySelectorAll(".hero-carousel-slide");
    const dots = carousel.querySelectorAll(".hero-carousel-dots span");
    if (!track || slides.length === 0) return;

    const slideCount = slides.length;
    const clone = slides[0].cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);

    let index = 0;
    const intervalMs = 3000;

    function updateDots() {
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === index % slideCount);
      });
    }

    function goTo(nextIndex, animate = true) {
      if (!animate) {
        track.style.transition = "none";
      } else {
        track.style.transition = "";
      }
      index = nextIndex;
      track.style.transform = `translateX(-${index * 100}%)`;
      if (!animate) {
        track.getBoundingClientRect();
        track.style.transition = "";
      }
      updateDots();
    }

    function advance() {
      const next = index + 1;
      goTo(next);
      if (next === slideCount) {
        track.addEventListener(
          "transitionend",
          () => goTo(0, false),
          { once: true }
        );
      }
    }

    function resetTimer() {
      clearInterval(timer);
      timer = setInterval(advance, intervalMs);
    }

    dots.forEach((dot, i) => {
      dot.setAttribute("role", "button");
      dot.setAttribute("tabindex", "0");
      dot.setAttribute("aria-label", `Slide ${i + 1}`);

      function selectSlide() {
        if (index % slideCount === i) {
          if (index === slideCount) goTo(i, false);
          return;
        }
        goTo(i, index < slideCount);
        resetTimer();
      }

      dot.addEventListener("click", selectSlide);
      dot.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectSlide();
        }
      });
    });

    let timer = setInterval(advance, intervalMs);

    carousel.addEventListener("mouseenter", () => clearInterval(timer));
    carousel.addEventListener("mouseleave", resetTimer);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.lang = currentLang;
    applyTranslations();
    renderLangSwitcher();
    renderLegalContent();
    updateMeta();
    setupMobileNav();
    setupDownloadLinks();
    setupHeroCarousel();
  });

  window.QiaoMuYuSite = { setLanguage, t, currentLang: () => currentLang };
})();
