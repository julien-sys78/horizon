/* =========================================================
   HORIZON — interactions & animations de scroll
   GSAP + ScrollTrigger (chargés depuis cdnjs dans index.html)
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Année du footer ---------- */
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Menu mobile ---------- */
  const gnav = $('.gnav');
  const burger = $('.gnav__burger');
  const mmenu = $('#mobile-menu');

  const setMenu = (open) => {
    gnav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    mmenu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && window.gsap && !reduceMotion) {
      gsap.fromTo($$('li', mmenu), { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power3.out' });
    }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', mmenu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Navigation locale : fond flouté une fois collée ---------- */
  const lnav = $('.lnav');
  const onScroll = () => lnav.classList.toggle('is-stuck', window.scrollY > gnav.offsetHeight);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Navigation locale : lien de la section courante ---------- */
  const lnavLinks = $$('.lnav__link');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      lnavLinks.forEach((l) => l.classList.toggle('is-current', l.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  lnavLinks.forEach((l) => {
    const target = $(l.getAttribute('href'));
    if (target) sectionObserver.observe(target);
  });

  /* ---------- Chapitres : fondu entre les images au fil des étapes ---------- */
  const chapterImgs = $$('.chapters__media img');
  const chapterDots = $$('.chapters__dots li');
  const steps = $$('.step');
  const setChapter = (i) => {
    chapterImgs.forEach((img, j) => img.classList.toggle('is-active', i === j));
    chapterDots.forEach((dot, j) => dot.classList.toggle('is-active', i === j));
    steps.forEach((step, j) => step.classList.toggle('is-active', i === j));
  };
  const stepObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setChapter(steps.indexOf(entry.target));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((s) => stepObserver.observe(s));
  setChapter(0);

  /* ---------- Galerie : carrousel avec lecture automatique ---------- */
  const gallery = $('.gallery');
  const scroller = $('.gallery__scroller');
  const items = $$('.gitem', scroller);
  const dotsWrap = $('.gallery__dots');
  const playBtn = $('.gallery__play');
  const SLIDE_MS = 5000;
  let current = -1;
  let timer = null;
  let playing = !reduceMotion;
  let inView = false;

  gallery.style.setProperty('--slide-ms', SLIDE_MS + 'ms');

  const dots = items.map((_, i) => {
    const b = document.createElement('button');
    b.className = 'gallery__dot';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Image ${i + 1} sur ${items.length}`);
    b.innerHTML = '<i></i>';
    b.addEventListener('click', () => goTo(i));
    dotsWrap.append(b);
    return b;
  });

  const goTo = (i) => {
    const item = items[i];
    scroller.scrollTo({ left: item.offsetLeft - (scroller.clientWidth - item.clientWidth) / 2 });
  };

  const schedule = () => {
    clearTimeout(timer);
    const active = playing && inView;
    gallery.classList.toggle('is-playing', active);
    if (active) timer = setTimeout(() => goTo((current + 1) % items.length), SLIDE_MS);
  };

  const setActive = (i) => {
    if (i === current) return;
    current = i;
    items.forEach((it, j) => it.classList.toggle('is-active', i === j));
    dots.forEach((d, j) => {
      d.classList.toggle('is-active', i === j);
      d.setAttribute('aria-selected', String(i === j));
    });
    schedule();
  };

  let raf = 0;
  scroller.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const center = scroller.scrollLeft + scroller.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      items.forEach((it, j) => {
        const d = Math.abs(it.offsetLeft + it.clientWidth / 2 - center);
        if (d < bestDist) { bestDist = d; best = j; }
      });
      setActive(best);
    });
  }, { passive: true });

  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.dataset.state = playing ? 'playing' : 'paused';
    playBtn.setAttribute('aria-label', playing ? 'Mettre en pause' : 'Lire');
    schedule();
  });
  if (!playing) { playBtn.dataset.state = 'paused'; playBtn.setAttribute('aria-label', 'Lire'); }

  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; schedule(); }, { threshold: 0.35 }).observe(scroller);
  setActive(0);

  /* =========================================================
     ANIMATIONS GSAP
     ========================================================= */
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  /* Découpe du manifeste en mots (le passage en dégradé reste un seul bloc) */
  const statement = $('[data-words]');
  const words = [];
  [...statement.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(' '); return; }
        const span = document.createElement('span');
        span.className = 'w';
        span.textContent = part;
        words.push(span);
        frag.append(span);
      });
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      words.push(node);
    }
  });

  const mm = gsap.matchMedia();

  mm.add({
    isDesktop: '(min-width: 768px)',
    isMobile: '(max-width: 767px)',
    motionOK: '(prefers-reduced-motion: no-preference)',
  }, (ctx) => {
    const { isDesktop, motionOK } = ctx.conditions;
    if (!motionOK) return;

    /* ---------- Hero : entrée ---------- */
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.hero__media img', { scale: 1.3, duration: 2.8, ease: 'power2.out' }, 0)
      .from('.hero__eyebrow', { y: 24, opacity: 0, duration: 1 }, 0.35)
      .from('.hero__title span', { y: 90, opacity: 0, duration: 1.4 }, 0.45)
      .from('.hero__sub', { y: 30, opacity: 0, duration: 1.1 }, 0.8)
      .from('.hero__ctas', { y: 20, opacity: 0, duration: 1.1 }, 1)
      .from('.hero__scroll', { opacity: 0, duration: 1 }, 1.5);

    /* ---------- Hero : l'image se rétracte en carte au scroll ---------- */
    gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=100%', scrub: true, pin: true },
    })
      .to('.hero__content', { y: -120, scale: 0.92, opacity: 0, ease: 'power1.in' }, 0)
      .to('.hero__scroll', { opacity: 0, duration: 0.15 }, 0)
      .fromTo('.hero__media, .hero__shade',
        { clipPath: 'inset(0% 0% 0% 0% round 0px)' },
        { clipPath: isDesktop ? 'inset(9% 7% 9% 7% round 36px)' : 'inset(12% 5% 12% 5% round 24px)', ease: 'none' }, 0)
      .to('.hero__shade', { opacity: 0.4, ease: 'none' }, 0);

    /* ---------- Manifeste : les mots s'allument un à un ---------- */
    // Les mots passent du gris au blanc (le gris de départ garde un contraste suffisant)
    const plain = words.filter((w) => w.classList.contains('w'));
    const grad = words.filter((w) => !w.classList.contains('w'));
    const tl = gsap.timeline({ scrollTrigger: { trigger: statement, start: 'top 78%', end: 'bottom 42%', scrub: true } });
    tl.fromTo(plain, { color: '#6e6e73' }, { color: '#f5f5f7', stagger: 0.1, ease: 'none' }, 0);
    if (grad.length) tl.fromTo(grad, { opacity: 0.5 }, { opacity: 1, ease: 'none', duration: 0.6 }, '>-0.3');

    /* ---------- Image qui s'ouvre en plein écran ---------- */
    gsap.timeline({
      scrollTrigger: { trigger: '.expand', start: 'top top', end: '+=150%', scrub: true, pin: true },
    })
      .fromTo('.expand__frame',
        { clipPath: isDesktop ? 'inset(22% 31% 22% 31% round 32px)' : 'inset(24% 10% 24% 10% round 24px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo('.expand__frame img', { scale: 1.4 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo('.expand__text > *', { y: 50, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 0.35, ease: 'power2.out' }, 0.75);

    /* ---------- Apparitions en fondu (data-reveal) ---------- */
    gsap.set('[data-reveal]', { y: 60, opacity: 0 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%',
      end: 'max',
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.12, overwrite: true }),
    });

    /* ---------- Compteurs ---------- */
    $$('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count);
      const obj = { v: 0 };
      el.textContent = '0';
      gsap.to(obj, {
        v: end,
        duration: 2.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => { el.textContent = Math.round(obj.v); },
      });
    });

    /* ---------- Destinations : défilement horizontal épinglé (desktop) ---------- */
    if (isDesktop) {
      const track = $('.hscroll__track');
      const distance = () => track.scrollWidth - window.innerWidth;
      const progress = $('.hscroll__progress span');

      const hTween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: '.hscroll__pin',
          start: 'top top',
          end: () => '+=' + distance(),
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => gsap.set(progress, { scaleX: self.progress }),
        },
      });

      $$('.hcard').forEach((card) => {
        gsap.fromTo($('img', card), { xPercent: -7 }, {
          xPercent: 7,
          ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true },
        });
        if (card.offsetLeft < window.innerWidth * 0.7) return; // déjà visible au départ
        gsap.from($$('.hcard__body > *', card), {
          y: 40,
          opacity: 0,
          stagger: 0.08,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left 70%', toggleActions: 'play none none reverse' },
        });
      });
    }

    /* ---------- Philosophie : parallaxe à deux vitesses ---------- */
    gsap.fromTo('.split__img--a img', { yPercent: -14 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.split', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.fromTo('.split__img--b', { y: isDesktop ? 140 : 60 }, {
      y: isDesktop ? -100 : -30, ease: 'none',
      scrollTrigger: { trigger: '.split', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.fromTo('.split__img--b img', { yPercent: 0 }, {
      yPercent: -14, ease: 'none',
      scrollTrigger: { trigger: '.split', start: 'top bottom', end: 'bottom top', scrub: true },
    });

    /* ---------- Bento : léger zoom arrière des images à l'apparition ---------- */
    $$('.tile--img img').forEach((img) => {
      gsap.fromTo(img, { scale: 1.18 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'center center', scrub: true },
      });
    });

    /* ---------- CTA final : zoom lent de l'image ---------- */
    gsap.fromTo('.cta__media img', { scale: 1.3 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom bottom', scrub: true },
    });
  });

  /* Recalcule les positions une fois les images chargées */
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
