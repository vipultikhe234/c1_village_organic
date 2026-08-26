(() => {
  const doc = document.documentElement;
  const header = document.querySelector('[data-header]');
  const menuBtn = document.querySelector('[data-menu-btn]');
  const mobileNav = document.querySelector('[data-mobile-nav]');
  const page = document.body.dataset.page || '';
  const heroDark = document.body.hasAttribute('data-hero-dark');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  requestAnimationFrame(() => doc.classList.add('is-ready'));

  const markCurrent = (selector) => {
    document.querySelectorAll(selector).forEach((a) => {
      a.classList.add('is-current');
      a.setAttribute('aria-current', 'page');
    });
  };
  if (page === 'index') {
    markCurrent('[data-nav] a[href="index.html"]');
    markCurrent('[data-mobile-nav] a[href="index.html"]');
  } else {
    markCurrent(`[data-nav] a[href="${page}.html"]`);
    markCurrent(`[data-mobile-nav] a[href="${page}.html"]`);
  }

  if (heroDark) header?.classList.add('is-hero-dark');
  else header?.classList.add('is-solid');

  /* Light parallax via CSS var — avoids fighting ken-burns keyframes */
  let scrollQueued = false;
  const applyScroll = () => {
    scrollQueued = false;
    const y = window.scrollY || 0;
    header?.classList.toggle('is-on', y > 24);
    if (!reduced) {
      doc.style.setProperty('--hero-parallax', `${Math.min(y * 0.08, 48)}px`);
    }
  };
  const onScroll = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(applyScroll);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  applyScroll();

  const setMenu = (open) => {
    menuBtn?.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileNav?.classList.toggle('is-open', open);
    document.body.classList.toggle('is-menu-open', open);
  };
  menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  mobileNav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* Smooth in-page anchors */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  });

  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    );
    document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach((el, i) => {
      el.style.setProperty('--delay', `${(i % 6) * 70}ms`);
      io.observe(el);
    });
  } else {
    document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach((el) => el.classList.add('is-in'));
  }

  /* Count-up for proof stats (Amari-style) */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    if (Number.isNaN(target)) return;
    const suffix = el.dataset.suffix ?? (el.textContent.includes('+') ? '+' : '');
    const format = (n) =>
      (Number.isInteger(target) ? Math.round(n).toLocaleString('en-IN') : n.toFixed(1)) + suffix;

    if (reduced) {
      el.textContent = format(target);
      return;
    }

    const run = () => {
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min(1, (ts - start) / 1400);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = format(target * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      const cio = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          run();
          cio.disconnect();
        }
      }, { threshold: 0.4 });
      cio.observe(el);
    } else {
      run();
    }
  });

  if (!reduced) {
    document.querySelectorAll('[data-tilt]').forEach((stage) => {
      const img = stage.querySelector('img');
      if (!img) return;
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
        img.classList.remove('is-float');
      });
      stage.addEventListener('pointerleave', () => {
        img.style.transform = '';
        img.classList.add('is-float');
      });
    });
  }

  const WA_NUMBER = '917040800894';

  /** Prefill WhatsApp chat from the order / inquiry form. */
  function buildOrderWhatsAppUrl({ intent, name, phone, size, message } = {}) {
    const isOrder = String(intent || 'order') !== 'inquiry';
    const n = String(name || '').trim() || '—';
    const p = String(phone || '').trim() || '—';
    const product = String(size || '').trim();
    const m = String(message || '').trim();

    const lines = [
      'Hi Village Organic 👋',
      '',
      isOrder
        ? 'I would like to *place an order* for bilona ghee.'
        : 'I have a *general inquiry* about Village Organic / bilona ghee.',
      '',
      `*Type:* ${isOrder ? 'Order' : 'Inquiry'}`,
      `*Name:* ${n}`,
      `*Phone / WhatsApp:* ${p}`,
    ];

    if (isOrder && product) {
      lines.push(`*Product:* ${product}`);
    }

    if (m) {
      lines.push('', isOrder ? '*Quantity / city / notes:*' : '*My question:*', m);
    }

    lines.push(
      '',
      isOrder
        ? 'Please confirm availability and delivery. Thank you!'
        : 'Please reply when you can. Thank you!',
    );

    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  document.querySelectorAll('[data-form]').forEach((form) => {
    const productField = form.querySelector('[data-product-field]');
    const sizeSelect = form.querySelector('#size, select[name="size"]');
    const submitBtn = form.querySelector('[data-form-submit]');
    const messageBox = form.querySelector('textarea[name="message"]');

    const syncIntent = () => {
      const intent = form.querySelector('input[name="intent"]:checked')?.value || 'order';
      const isOrder = intent === 'order';
      if (productField) {
        productField.hidden = !isOrder;
        productField.setAttribute('aria-hidden', isOrder ? 'false' : 'true');
      }
      if (sizeSelect) {
        sizeSelect.required = isOrder;
        sizeSelect.disabled = !isOrder;
        if (!isOrder) sizeSelect.removeAttribute('required');
      }
      if (submitBtn) {
        submitBtn.textContent = isOrder ? 'Send order on WhatsApp' : 'Send inquiry on WhatsApp';
      }
      if (messageBox) {
        messageBox.placeholder = isOrder
          ? 'Quantity, city, delivery notes'
          : 'Your question (pricing, shipping, bulk, etc.)';
      }
    };

    form.querySelectorAll('input[name="intent"]').forEach((radio) => {
      radio.addEventListener('change', syncIntent);
    });
    syncIntent();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const url = buildOrderWhatsAppUrl({
        intent: fd.get('intent'),
        name: fd.get('name'),
        phone: fd.get('phone'),
        size: fd.get('size'),
        message: fd.get('message'),
      });
      window.open(url, '_blank', 'noopener,noreferrer');
      const note = form.querySelector('[data-form-note]');
      if (note) {
        note.hidden = false;
        const isOrder = String(fd.get('intent') || 'order') !== 'inquiry';
        note.textContent = isOrder
          ? 'Opening WhatsApp with your order details…'
          : 'Opening WhatsApp with your inquiry…';
      }
    });
  });

  document.querySelectorAll('[data-newsletter]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = String(new FormData(form).get('email') || '').trim();
      const text = [
        'Hi Village Organic 👋',
        '',
        'Please keep me updated on bilona ghee offers and new batches.',
        email ? `*Email:* ${email}` : '',
        '',
        'Thank you!',
      ]
        .filter(Boolean)
        .join('\n');
      window.open(
        `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`,
        '_blank',
        'noopener,noreferrer',
      );
    });
  });
})();
