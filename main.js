/* Daliso Kafunda portfolio — vanilla JavaScript interactions */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile navigation
  const menuToggle = $('.menu-toggle');
  const nav = $('.site-header nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
      nav.classList.toggle('is-open', !isOpen);
      document.body.classList.toggle('menu-open', !isOpen);
    });
    $$('a', nav).forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      document.body.classList.remove('menu-open');
    }));
  }

  // Scroll reveal, with a no-JS-friendly visible fallback.
  const revealItems = $$('.reveal, .interest-card, .gallery-card, .media-card, .info-item');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealItems.forEach((item, index) => {
      item.classList.add('will-reveal');
      item.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 75}ms`);
      revealObserver.observe(item);
    });
  } else revealItems.forEach(item => item.classList.add('is-visible'));

  // Reading progress line.
  const progress = $('.scroll-progress');
  let ticking = false;
  const updateScrollState = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${scrollable > 0 ? window.scrollY / scrollable : 0})`;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { window.requestAnimationFrame(updateScrollState); ticking = true; }
  }, { passive: true });
  updateScrollState();

  // Keep the current section reflected in the navigation.
  const sectionLinks = $$('nav a[href^="#"]');
  const sections = sectionLinks.map(link => $(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(link => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(section => sectionObserver.observe(section));
  }

  // Accessible image lightbox with keyboard support.
  const lightbox = $('.lightbox');
  const lightboxImage = $('figure img', lightbox || document);
  const lightboxCaption = $('figure figcaption', lightbox || document);
  const lightboxCounter = $('.lightbox-counter', lightbox || document);
  const galleryCards = $$('.gallery-card');
  let activeImage = 0;
  const imageData = galleryCards.map(card => {
    const img = $('img', card);
    const title = $('strong', card)?.textContent || img.alt;
    const caption = $('small', card)?.textContent || '';
    return { src: img.src, alt: img.alt, title, caption };
  });
  const showImage = index => {
    activeImage = (index + imageData.length) % imageData.length;
    const item = imageData[activeImage];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    lightboxCaption.textContent = `${item.title} — ${item.caption}`;
    lightboxCounter.textContent = `${String(activeImage + 1).padStart(2, '0')} / ${String(imageData.length).padStart(2, '0')}`;
  };
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
  };
  galleryCards.forEach((card, index) => {
    const img = $('img', card);
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `View larger image: ${imageData[index].title}`);
    const open = () => {
      showImage(index);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
      $('.lightbox-close', lightbox).focus();
    };
    img.addEventListener('click', open);
    img.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
  if (lightbox) {
    $('.lightbox-close', lightbox).addEventListener('click', closeLightbox);
    $('.lightbox-prev', lightbox).addEventListener('click', () => showImage(activeImage - 1));
    $('.lightbox-next', lightbox).addEventListener('click', () => showImage(activeImage + 1));
    lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', event => {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showImage(activeImage - 1);
      if (event.key === 'ArrowRight') showImage(activeImage + 1);
    });
  }

  // The video preview is a real play control, not a decorative dead button.
  const videoLaunch = $('.video-launch');
  const video = $('.media-details video');
  if (videoLaunch && video) {
    videoLaunch.addEventListener('click', () => {
      video.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      const result = video.play();
      if (result && typeof result.catch === 'function') result.catch(() => video.focus());
      video.focus({ preventScroll: true });
    });
  }

  // Animate the custom audio bars only while audio is playing.
  const audio = $('.media-details audio');
  const audioBars = $$('.audio-bars i');
  if (audio && audioBars.length) {
    audio.addEventListener('play', () => document.body.classList.add('audio-playing'));
    ['pause', 'ended'].forEach(eventName => audio.addEventListener(eventName, () => document.body.classList.remove('audio-playing')));
  }

  // Build a real email draft from the contact form; mailto needs no server or API.
  const contactForm = $('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      const data = new FormData(contactForm);
      const name = String(data.get('Name') || '').trim();
      const email = String(data.get('Email') || '').trim();
      const message = String(data.get('Message') || '').trim();
      const subject = encodeURIComponent(`Portfolio message from ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name}\nReply to: ${email}`);
      const destination = 'daliso@example.com';
      if (destination === 'daliso@example.com') {
        const note = $('.form-note', contactForm);
        if (note) note.textContent = 'Demo email address: replace daliso@example.com in index.html with your real address before publishing.';
      }
      window.location.href = `mailto:${destination}?subject=${subject}&body=${body}`;
    });
  }

  // Subtle pointer glow on large screens only.
  if (window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
    $$('.interest-card, .study-card, .info-panel').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
      });
    });
  }
})();
