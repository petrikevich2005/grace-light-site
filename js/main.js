document.addEventListener('DOMContentLoaded', () => {
  // ---- helpers ----
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // ---- элементы ----
  const header = $('#siteHeader');
  const brand = $('#brand');
  const nav = $('#mainNav');
  const menuBtn = $('#menuBtn');
  const mobileMenu = $('#mobileMenu');

  // ---- 1) Авто-скрытие навигации если не помещается ----
    function checkNavVisibility() {
    try {
        const headerW = header.clientWidth;
        const brandW = brand.offsetWidth;
        const navW = nav.scrollWidth;

        if (brandW + navW + 80 > headerW || window.innerWidth < 768) {
        // экран маленький или места не хватает → прячем nav, показываем кнопку
        nav.classList.add('hidden');
        menuBtn.classList.remove('hidden');
        } else {
        // места достаточно → показываем nav, прячем кнопку
        nav.classList.remove('hidden');
        menuBtn.classList.add('hidden');
        }
    } catch(e){}
    }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(checkNavVisibility, 120);
  });
  checkNavVisibility();

  // ---- 2) Мобильное меню (overlay) ----
  function openMobileMenu(){
    mobileMenu.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  window.closeMobileMenu = function(){
    mobileMenu.classList.add('hidden');
    document.body.style.overflow = '';
  };
  menuBtn.addEventListener('click', () => {
    openMobileMenu();
  });
  $$('#mobileMenu .nav-link-mobile').forEach(a => a.addEventListener('click', () => {
    closeMobileMenu();
  }));

  // ---- 3) Smooth scroll с учётом хедера ----
  const headerHeight = () => header.getBoundingClientRect().height || 80;
  $$('.nav-link, .nav-link-mobile, a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight() - 10;
      window.scrollTo({ top, behavior: 'smooth' });
      closeMobileMenu();
    });
  });

  // ---- 4) Галерея / lightbox ----
  const thumbEls = $$('.thumb');
  const galleries = {};
  thumbEls.forEach(img => {
    const key = img.dataset.gallery || 'all';
    const src = img.dataset.full || img.src;
    if (!galleries[key]) galleries[key] = [];
    img.dataset._gIndex = galleries[key].push(src) - 1;
  });

  let currentGallery = null;
  let currentIndex = 0;
  const lightbox = $('#lightbox');
  const lbImage = $('#lbImage');
  const lbCaption = $('#lbCaption');
  const lbCounter = $('#lbCounter');
  const lbPrev = $('#lbPrev');
  const lbNext = $('#lbNext');

  function updateLightboxControls() {
    const len = currentGallery.length;
    lbCounter.textContent = `${currentIndex + 1} / ${len}`;
    if (len > 1) {
      lbPrev.classList.remove('hidden');
      lbNext.classList.remove('hidden');
    } else {
      lbPrev.classList.add('hidden');
      lbNext.classList.add('hidden');
    }
  }

  function showImage() {
    lbImage.src = currentGallery[currentIndex];
    lbCaption.textContent = '';
    updateLightboxControls();
  }

  function openGallery(key, idx = 0) {
    currentGallery = galleries[key] || [];
    if (!currentGallery || currentGallery.length === 0) return;
    currentIndex = Number(idx) || 0;
    showImage();
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
    lbImage.src = '';
  }
  window.closeLightbox = closeLightbox;

  function nextImage() {
    if (!currentGallery) return;
    currentIndex = (currentIndex + 1) % currentGallery.length;
    showImage();
  }
  function prevImage() {
    if (!currentGallery) return;
    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
    showImage();
  }

  thumbEls.forEach(img => {
    img.addEventListener('click', () => {
      const key = img.dataset.gallery || 'all';
      const idx = img.dataset._gIndex || 0;
      openGallery(key, idx);
    });
  });

  lbNext.addEventListener('click', nextImage);
  lbPrev.addEventListener('click', prevImage);

  $$('.open-gallery').forEach(btn => {
    btn.addEventListener('click', () => {
      const galleryKey = btn.dataset.gallery || 'all';
      openGallery(galleryKey, 0);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') closeLightbox();
  });

  // ---- 5) Форма: отправка на Formspree ----
  const contactForm = $('#contactForm');
  const formFeedback = $('#formFeedback');

  if (contactForm) {
    contactForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const formData = new FormData(contactForm);

      // === ЗАМЕНИТЕ НА СВОЙ ID Formspree ===
      const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xandkooa';
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-60', 'cursor-not-allowed');

      try {
        const resp = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        if (resp.ok) {
          formFeedback.textContent = 'Спасибо! Мы свяжемся с вами.';
          formFeedback.classList.remove('hidden');
          contactForm.reset();
          setTimeout(() => formFeedback.classList.add('hidden'), 6000);
        } else {
          const j = await resp.json().catch(()=>null);
          alert('Ошибка отправки формы. Попробуйте позже.');
          console.error('Form error', j || resp.statusText || resp);
        }
      } catch (err) {
        alert('Ошибка сети при отправке формы. Проверьте соединение.');
        console.error(err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
      }
    });
  }

  // ---- 6) начальные настройки ----
  if (window.innerWidth >= 768) menuBtn.classList.add('hidden');
  checkNavVisibility();
});
