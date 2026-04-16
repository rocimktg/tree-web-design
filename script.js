(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const focusableSelector =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

  const initSmoothScroll = () => {
    if (prefersReduced) return;
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      if (anchor.dataset.smoothBound === 'true') return;
      anchor.dataset.smoothBound = 'true';
      anchor.addEventListener('click', (event) => {
        const id = anchor.getAttribute('href')?.slice(1);
        const target = id ? document.getElementById(id) : null;
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  const initNav = () => {
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.nav__toggle');
    const panel = document.getElementById('nav-panel');
    if (!header || !toggle || !panel) return;
    if (header.dataset.navBound === 'true') return;
    header.dataset.navBound = 'true';

    const handleScroll = () => {
      const threshold = 8;
      if (window.scrollY > threshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    const closeMenu = () => {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      header.classList.remove('is-open');
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onOutsideClick);
    };

    const openMenu = () => {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      header.classList.add('is-open');
      const firstFocusable = panel.querySelector(focusableSelector);
      if (firstFocusable) firstFocusable.focus({ preventScroll: true });
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('click', onOutsideClick);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeMenu();
        return;
      }

      if (e.key === 'Tab' && !panel.hidden) {
        const focusables = Array.from(panel.querySelectorAll(focusableSelector)).filter(
          (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const onOutsideClick = (e) => {
      if (panel.hidden) return;
      const clickedInsidePanel = panel.contains(e.target);
      const clickedToggle = toggle.contains(e.target);
      if (!clickedInsidePanel && !clickedToggle) closeMenu();
    };

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (expanded) closeMenu();
      else openMenu();
    });

    panel.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      const toggleBtn = e.target.closest('.navLinks__toggle');
      if (toggleBtn) {
        e.preventDefault();
        const parentItem = toggleBtn.closest('.navLinks__item');
        const sub = parentItem?.querySelector('.navLinks__sub');
        const isOpen = parentItem?.classList.contains('navLinks__item--open');
        if (sub) {
          parentItem.classList.toggle('navLinks__item--open', !isOpen);
          toggleBtn.setAttribute('aria-expanded', String(!isOpen));
          sub.hidden = isOpen;
        }
        return;
      }
      if (link) closeMenu();
    });
  };

  const initFaq = () => {
    const faqToggles = document.querySelectorAll('.faq-toggle');
    const faqPanels = document.querySelectorAll('.faq-panel');

    if (faqToggles.length && faqPanels.length) {
      faqToggles.forEach((button) => {
        button.addEventListener('click', () => {
          if (button.classList.contains('is-active')) return;

          const target = button.dataset.panel;

          faqToggles.forEach((toggleBtn) => {
            const isActive = toggleBtn === button;
            toggleBtn.classList.toggle('is-active', isActive);
            toggleBtn.setAttribute('aria-selected', isActive ? 'true' : 'false');
          });

          faqPanels.forEach((panelEl) => {
            const isTarget = panelEl.dataset.panel === target;
            panelEl.classList.toggle('is-active', isTarget);
            panelEl.hidden = !isTarget;
            panelEl.querySelectorAll('details').forEach((detail) => {
              detail.open = false;
            });
          });
        });
      });

      document.querySelectorAll('.faq-item').forEach((item) => {
        item.addEventListener('toggle', () => {
          if (!item.open) return;
          document.querySelectorAll('.faq-item').forEach((other) => {
            if (other !== item) other.open = false;
          });
        });
      });
    }
  };

  const initHeroCycle = () => {
    const el = document.querySelector('.hero-cycle');
    if (!el) return;

    const words = ['Calls.', 'Jobs.', 'Leads.', 'Reviews.'];
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const TYPE_SPEED   = 85;
    const DELETE_SPEED = 50;
    const PAUSE_FULL   = 2200;
    const PAUSE_EMPTY  = 320;

    const tick = () => {
      const current = words[wordIndex];

      if (deleting) {
        charIndex--;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          setTimeout(tick, PAUSE_EMPTY);
        } else {
          setTimeout(tick, DELETE_SPEED);
        }
      } else {
        charIndex++;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(tick, PAUSE_FULL);
        } else {
          setTimeout(tick, TYPE_SPEED);
        }
      }
    };

    tick();
  };

  const initIltCarousel = () => {
    const track = document.querySelector('.ilt__track');
    if (!track) return;

    const slides = Array.from(track.querySelectorAll('.ilt__slide'));
    const dots = Array.from(document.querySelectorAll('.ilt__dot'));
    const prevBtn = document.querySelector('.ilt__nav--prev');
    const nextBtn = document.querySelector('.ilt__nav--next');
    if (!slides.length) return;

    let current = 0;

    const goTo = (index) => {
      slides[current].classList.remove('is-active');
      dots[current]?.classList.remove('is-active');
      dots[current]?.setAttribute('aria-selected', 'false');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      dots[current]?.classList.add('is-active');
      dots[current]?.setAttribute('aria-selected', 'true');
    };

    prevBtn?.addEventListener('click', () => goTo(current - 1));
    nextBtn?.addEventListener('click', () => goTo(current + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

    let touchStartX = 0;
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', (e) => {
      const delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 50) goTo(delta < 0 ? current + 1 : current - 1);
    }, { passive: true });
  };

  const run = () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    initNav();
    initSmoothScroll();
    initFaq();
    initHeroCycle();
    initIltCarousel();
  };

  const ready = window.partialsReady instanceof Promise ? window.partialsReady : Promise.resolve();
  ready.then(run).catch(run);
})();
