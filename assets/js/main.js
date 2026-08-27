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

  /** Open WhatsApp direct chat across mobile & desktop browsers */
  function openWhatsApp(text) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?phone=${WA_NUMBER}&text=${encoded}`;
    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /** Prefill WhatsApp chat from the order / inquiry form. */
  function buildOrderWhatsAppUrl({ name, phone, size, message } = {}) {
    const n = String(name || '').trim() || '—';
    const p = String(phone || '').trim() || '—';
    const product = String(size || '').trim();
    const m = String(message || '').trim();

    const lines = [
      'Hi Village Organic 👋',
      '',
      'I have an *order enquiry* for Village Organic bilona ghee.',
      '',
      `*Name:* ${n}`,
      `*Phone / WhatsApp:* ${p}`,
    ];

    if (product) {
      lines.push(`*Product of Interest:* ${product}`);
    }

    if (m) {
      lines.push('', '*Enquiry / Notes:*', m);
    }

    lines.push('', 'Please share pricing and availability. Thank you!');

    return lines.join('\n');
  }

  document.querySelectorAll('[data-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const text = buildOrderWhatsAppUrl({
        name: fd.get('name'),
        phone: fd.get('phone'),
        size: fd.get('size'),
        message: fd.get('message'),
      });
      openWhatsApp(text);
      const note = form.querySelector('[data-form-note]');
      if (note) {
        note.hidden = false;
        note.textContent = 'Opening WhatsApp with your enquiry details…';
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
      openWhatsApp(text);
    });
  });

  /* ——— Add to Cart & WhatsApp Order Drawer System ——— */
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem('vo_cart') || '[]');
  } catch (err) {
    cart = [];
  }

  const saveCart = () => {
    localStorage.setItem('vo_cart', JSON.stringify(cart));
    updateCartUI();
  };

  const addToCart = (item) => {
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }
    saveCart();
  };

  const updateQty = (id, delta) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter((i) => i.id !== id);
    }
    saveCart();
  };

  const removeFromCart = (id) => {
    cart = cart.filter((i) => i.id !== id);
    saveCart();
  };

  const getCartTotal = () => cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const getCartCount = () => cart.reduce((acc, item) => acc + item.qty, 0);

  const cartOverlay = document.createElement('div');
  cartOverlay.className = 'cart-overlay';
  document.body.appendChild(cartOverlay);

  const cartDrawer = document.createElement('div');
  cartDrawer.className = 'cart-drawer';
  cartDrawer.innerHTML = `
    <div class="cart-drawer__header">
      <h3>Your Farm Cart</h3>
      <button class="cart-drawer__close" type="button" aria-label="Close cart">✕</button>
    </div>
    <div class="cart-drawer__body" data-cart-items></div>
    <div class="cart-drawer__footer">
      <div class="cart-summary-row">
        <span>Total Amount:</span>
        <span class="cart-summary-total" data-cart-total>₹0</span>
      </div>
      <button class="cart-checkout-btn" type="button" data-cart-checkout>
        <span>📲 Send Order via WhatsApp</span>
      </button>
    </div>
  `;
  document.body.appendChild(cartDrawer);

  const openCart = () => {
    cartOverlay.classList.add('is-active');
    cartDrawer.classList.add('is-active');
  };

  const closeCart = () => {
    cartOverlay.classList.remove('is-active');
    cartDrawer.classList.remove('is-active');
  };

  cartOverlay.addEventListener('click', closeCart);
  cartDrawer.querySelector('.cart-drawer__close').addEventListener('click', closeCart);

  // Add Cart trigger button to header
  const headerInner = document.querySelector('.site-header__inner');
  if (headerInner) {
    const cartToggle = document.createElement('button');
    cartToggle.className = 'cart-toggle-btn';
    cartToggle.type = 'button';
    cartToggle.innerHTML = `🛒 Cart <span class="cart-count-badge" data-cart-badge>0</span>`;
    cartToggle.addEventListener('click', openCart);
    const navToggleBtn = headerInner.querySelector('[data-menu-btn]') || headerInner.querySelector('.menu-btn');
    headerInner.insertBefore(cartToggle, navToggleBtn);
  }

  // Floating mobile cart trigger
  const floatCart = document.createElement('button');
  floatCart.className = 'float-cart';
  floatCart.type = 'button';
  floatCart.innerHTML = `🛒 Order (<span data-cart-badge-float>0</span>)`;
  floatCart.addEventListener('click', openCart);
  document.body.appendChild(floatCart);

  const updateCartUI = () => {
    const count = getCartCount();
    const total = getCartTotal();

    document.querySelectorAll('[data-cart-badge]').forEach((el) => {
      el.textContent = String(count);
    });

    const floatCartBtn = document.querySelector('.float-cart');
    if (floatCartBtn) {
      floatCartBtn.innerHTML = count > 0
        ? `🛒 Cart (${count}) · ₹${total.toLocaleString('en-IN')}`
        : `🛒 Cart (<span data-cart-badge-float>0</span>)`;
    }

    // Sync Product Card Quantity Controls directly on the page
    document.querySelectorAll('[data-add-cart]').forEach((btn) => {
      const id = btn.dataset.id;
      const cartItem = cart.find((i) => i.id === id);
      const parentBody = btn.parentElement;

      if (!parentBody) return;

      if (cartItem && cartItem.qty > 0) {
        let stepper = parentBody.querySelector(`.product-card-qty[data-card-qty-id="${id}"]`);
        if (!stepper) {
          stepper = document.createElement('div');
          stepper.className = 'product-card-qty';
          stepper.setAttribute('data-card-qty-id', id);
          btn.style.display = 'none';
          parentBody.appendChild(stepper);
        }
        stepper.innerHTML = `
          <button type="button" data-card-qty-btn data-id="${id}" data-delta="-1" aria-label="Decrease quantity">−</button>
          <span>${cartItem.qty} in cart</span>
          <button type="button" data-card-qty-btn data-id="${id}" data-delta="1" aria-label="Increase quantity">+</button>
        `;
      } else {
        const stepper = parentBody.querySelector(`.product-card-qty[data-card-qty-id="${id}"]`);
        if (stepper) stepper.remove();
        btn.style.display = '';
      }
    });

    const itemsContainer = cartDrawer.querySelector('[data-cart-items]');
    const totalEl = cartDrawer.querySelector('[data-cart-total]');

    if (totalEl) totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;

    if (!itemsContainer) return;

    if (cart.length === 0) {
      itemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <p style="font-weight:600;font-size:1.05rem;color:var(--forest);margin:0 0 0.35rem">Your cart is empty</p>
          <p style="font-size:0.85rem">Explore our pure Bilona Ghee &amp; add your favourite jars!</p>
        </div>
      `;
    } else {
      let html = cart.map((item) => `
        <div class="cart-item">
          <img class="cart-item__thumb" src="${item.image || 'assets/images/hero-home.png'}" alt="${item.name}">
          <div>
            <h4 class="cart-item__title">${item.name}</h4>
            <p class="cart-item__variant">${item.variant}</p>
            <p class="cart-item__price">₹${(item.price * item.qty).toLocaleString('en-IN')}</p>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.4rem">
            <button class="cart-item__remove" type="button" data-remove-id="${item.id}">🗑️</button>
            <div class="cart-item__qty">
              <button type="button" data-qty-id="${item.id}" data-delta="-1">−</button>
              <span>${item.qty}</span>
              <button type="button" data-qty-id="${item.id}" data-delta="1">+</button>
            </div>
          </div>
        </div>
      `).join('');

      html += `
        <div class="cart-user-details">
          <h4>Customer Delivery Details</h4>
          <input type="text" id="cart-cust-name" placeholder="Your Full Name" required />
          <input type="tel" id="cart-cust-phone" placeholder="WhatsApp Phone Number" required />
          <textarea id="cart-cust-addr" placeholder="Delivery Address &amp; Pincode" required></textarea>
        </div>
      `;

      itemsContainer.innerHTML = html;
    }
  };

  cartDrawer.addEventListener('click', (e) => {
    const qtyBtn = e.target.closest('[data-qty-id]');
    if (qtyBtn) {
      const id = qtyBtn.dataset.qtyId;
      const delta = parseInt(qtyBtn.dataset.delta, 10);
      updateQty(id, delta);
      return;
    }
    const removeBtn = e.target.closest('[data-remove-id]');
    if (removeBtn) {
      removeFromCart(removeBtn.dataset.removeId);
    }
  });

  // WhatsApp Order Compiler
  cartDrawer.querySelector('[data-cart-checkout]').addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Your cart is empty! Please add products before checking out.');
      return;
    }

    const name = String(document.getElementById('cart-cust-name')?.value || '').trim();
    const phone = String(document.getElementById('cart-cust-phone')?.value || '').trim();
    const addr = String(document.getElementById('cart-cust-addr')?.value || '').trim();

    if (!name || !phone || !addr) {
      alert('Please fill in your Name, WhatsApp Phone Number, and Delivery Address to place your order.');
      return;
    }

    const total = getCartTotal();

    const itemLines = cart.map((item) => `• *${item.qty}x ${item.name} (${item.variant})* — ₹${(item.price * item.qty).toLocaleString('en-IN')}`);

    const messageLines = [
      'Hi Village Organic 👋',
      '',
      'I would like to *place an order* for bilona ghee from your website.',
      '',
      '📦 *Order Details:*',
      ...itemLines,
      '',
      `💰 *Total Amount:* ₹${total.toLocaleString('en-IN')}`,
      '--------------------------------',
      '👤 *Customer Details:*',
      `*Name:* ${name}`,
      `*Phone / WhatsApp:* ${phone}`,
      `*Delivery Address:* ${addr}`,
      '',
      'Please confirm availability and delivery. Thank you!',
    ];

    openWhatsApp(messageLines.join('\n'));
  });

  // Toast notification element
  const toastEl = document.createElement('div');
  toastEl.className = 'cart-toast';
  document.body.appendChild(toastEl);

  let toastTimer = null;
  const showToast = (text) => {
    toastEl.innerHTML = `✨ ${text}`;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-show');
    }, 2400);
  };

  // Fly to Cart Animation with curved arc trajectory
  const triggerBadgeBump = () => {
    document.querySelectorAll('.cart-count-badge, .float-cart').forEach((el) => {
      el.classList.remove('is-bump');
      void el.offsetWidth;
      el.classList.add('is-bump');
    });
  };

  const animateFlyToCart = (addBtn, item) => {
    const origText = addBtn.innerHTML;
    addBtn.classList.add('is-added');
    addBtn.innerHTML = '✓ Added!';
    setTimeout(() => {
      addBtn.classList.remove('is-added');
      addBtn.innerHTML = origText;
    }, 1400);

    if (item && item.name) {
      showToast(`Added <strong>${item.name} (${item.variant})</strong> to your farm cart!`);
    }

    const productCard = addBtn.closest('.product') || addBtn.closest('.spotlight__card');
    const sourceImg = productCard?.querySelector('img');

    if (!sourceImg || reduced) {
      triggerBadgeBump();
      return;
    }

    const startRect = sourceImg.getBoundingClientRect();
    const targetBadge = document.querySelector('.cart-count-badge') || document.querySelector('.float-cart');
    const endRect = targetBadge ? targetBadge.getBoundingClientRect() : { left: window.innerWidth - 60, top: 20 };

    const clone = sourceImg.cloneNode(true);
    clone.className = 'fly-item-clone';
    clone.style.left = `${startRect.left}px`;
    clone.style.top = `${startRect.top}px`;
    clone.style.width = `${startRect.width}px`;
    clone.style.height = `${startRect.height}px`;
    document.body.appendChild(clone);

    // Calculate curved arc control trajectory
    const targetX = endRect.left + (endRect.width / 2) - 20;
    const targetY = endRect.top + (endRect.height / 2) - 20;

    requestAnimationFrame(() => {
      clone.style.left = `${targetX}px`;
      clone.style.top = `${targetY}px`;
      clone.style.width = '36px';
      clone.style.height = '36px';
      clone.style.opacity = '0.2';
      clone.style.transform = 'scale(0.25) rotate(720deg)';
    });

    setTimeout(() => {
      clone.remove();
      triggerBadgeBump();
    }, 850);
  };

  // Bind Add to Cart, Card Quantity Stepper & Order Enquiry buttons
  document.addEventListener('click', (e) => {
    const enquireBtn = e.target.closest('[data-enquiry]');
    if (enquireBtn) {
      e.preventDefault();
      const product = enquireBtn.dataset.product || '15 Litre Bulk Tin';
      const text = [
        'Hi Village Organic 👋',
        '',
        'I have an *order enquiry* for bilona ghee bulk tin.',
        '',
        `*Product:* ${product}`,
        '',
        'Please share wholesale pricing and delivery details. Thank you!'
      ].join('\n');
      openWhatsApp(text);
      return;
    }

    const cardQtyBtn = e.target.closest('[data-card-qty-btn]');
    if (cardQtyBtn) {
      e.preventDefault();
      const id = cardQtyBtn.dataset.id;
      const delta = parseInt(cardQtyBtn.dataset.delta, 10);
      updateQty(id, delta);
      return;
    }

    const addBtn = e.target.closest('[data-add-cart]');
    if (!addBtn) return;
    e.preventDefault();
    const item = {
      id: addBtn.dataset.id || 'pure-cow-1l',
      name: addBtn.dataset.name || 'Pure Cow Ghee',
      variant: addBtn.dataset.variant || '1 Litre',
      price: parseFloat(addBtn.dataset.price || '799'),
      image: addBtn.dataset.image || 'assets/images/pure-cow-1l.png'
    };
    addToCart(item);
    animateFlyToCart(addBtn, item);
  });

  updateCartUI();
})();
