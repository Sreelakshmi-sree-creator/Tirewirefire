/* ============================================================
   TEAM WIREFRAME — interactions
   Progressive enhancement: if any part of this file fails, the
   content is still visible and readable.
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var html = doc.documentElement;

  /* Only now may the CSS hide .reveal elements. If this file never loads,
     the class is never added and every section stays visible. */
  html.classList.add('js');

  /* ---------- Safety net: if anything below throws, reveal all ---------- */
  var safety = null;
  function armSafety() {
    safety = window.setTimeout(function () {
      html.classList.add('no-motion');
    }, 2500);
  }
  function clearSafety() {
    if (safety) { window.clearTimeout(safety); safety = null; }
  }
  armSafety();

  /* ---------- Year ---------- */
  var yearEl = doc.getElementById('year');
  if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }

  /* ---------- Sticky nav ---------- */
  var nav = doc.getElementById('nav');
  var lastStuck = null;
  function onScroll() {
    if (!nav) { return; }
    var stuck = window.scrollY > 24;
    if (stuck !== lastStuck) {
      nav.classList.toggle('is-stuck', stuck);
      lastStuck = stuck;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = doc.getElementById('burger');
  var navLinks = doc.getElementById('navLinks');

  function closeMenu() {
    if (!burger || !navLinks) { return; }
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    navLinks.classList.remove('is-open');
  }
  function openMenu() {
    if (!burger || !navLinks) { return; }
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    navLinks.classList.add('is-open');
  }

  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      if (open) { closeMenu(); } else { openMenu(); }
    });

    navLinks.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.tagName === 'A') { closeMenu(); }
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        burger.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 880) { closeMenu(); }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));

  function revealAll() {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealAll();
    html.classList.add('no-motion');
    clearSafety();
  } else if (reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var siblings = el.parentElement
            ? Array.prototype.slice.call(el.parentElement.children).filter(function (n) {
                return n.classList && n.classList.contains('reveal');
              })
            : [];
          var idx = siblings.indexOf(el);
          var delay = idx > 0 ? Math.min(idx, 5) * 70 : 0;
          el.style.transitionDelay = delay + 'ms';
          el.classList.add('is-in');
          io.unobserve(el);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    reveals.forEach(function (el) { io.observe(el); });

    /* Anything already in view on load resolves immediately. */

    /* Bulletproof fallback. Timers get throttled in background tabs and some
       embedded webviews, so we never rely on the clock alone: if the page has
       been scrolled past ~1.5 screens and nothing has revealed, or the tab
       becomes visible again with nothing revealed, show everything at once. */
    function revealedCount() {
      return doc.querySelectorAll('.reveal.is-in').length;
    }
    function forceReveal() {
      revealAll();
      html.classList.add('no-motion');
      clearSafety();
    }
    window.addEventListener('scroll', function () {
      if (window.scrollY > window.innerHeight * 1.5 && revealedCount() === 0) {
        forceReveal();
      }
    }, { passive: true });
    doc.addEventListener('visibilitychange', function () {
      if (!doc.hidden && revealedCount() === 0) { forceReveal(); }
    });
    window.requestAnimationFrame(function () {
      reveals.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92) { el.classList.add('is-in'); }
      });
    });
  } else {
    clearSafety();
  }

  /* ---------- Service card spotlight ---------- */
  Array.prototype.forEach.call(doc.querySelectorAll('.svc'), function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- FAQ accordion ---------- */
  var faqButtons = Array.prototype.slice.call(doc.querySelectorAll('.faq__q'));

  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = doc.getElementById(btn.getAttribute('aria-controls'));
      var isOpen = btn.getAttribute('aria-expanded') === 'true';

      /* one open at a time */
      faqButtons.forEach(function (other) {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          var op = doc.getElementById(other.getAttribute('aria-controls'));
          if (op) { op.classList.remove('is-open'); }
        }
      });

      btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      if (panel) { panel.classList.toggle('is-open', !isOpen); }
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = doc.getElementById('lightbox');
  var lbImg = doc.getElementById('lbImg');
  var lbCap = doc.getElementById('lbCap');
  var lbClose = doc.getElementById('lbClose');
  var lastFocus = null;

  function openLightbox(src, alt, caption) {
    if (!lb || !lbImg) { return; }
    lastFocus = doc.activeElement;
    lbImg.src = src;
    lbImg.alt = alt || '';
    if (lbCap) { lbCap.textContent = caption || ''; }
    lb.hidden = false;
    /* force reflow so the transition runs */
    void lb.offsetWidth;
    lb.classList.add('is-open');
    doc.body.style.overflow = 'hidden';
    if (lbClose) { lbClose.focus(); }
  }

  function closeLightbox() {
    if (!lb) { return; }
    lb.classList.remove('is-open');
    doc.body.style.overflow = '';
    window.setTimeout(function () {
      lb.hidden = true;
      if (lbImg) { lbImg.src = ''; }
    }, 320);
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  Array.prototype.forEach.call(doc.querySelectorAll('.work__item'), function (item) {
    var btn = item.querySelector('.work__btn');
    var img = item.querySelector('img');
    if (!btn || !img) { return; }
    btn.addEventListener('click', function () {
      openLightbox(img.getAttribute('src'), img.getAttribute('alt'), item.getAttribute('data-caption'));
    });
  });

  if (lbClose) { lbClose.addEventListener('click', closeLightbox); }
  if (lb) {
    lb.addEventListener('click', function (e) {
      if (e.target === lb) { closeLightbox(); }
    });
  }
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lb && !lb.hidden) { closeLightbox(); }
  });

  /* ---------- Enquiry form ---------- */
  var form = doc.getElementById('enquiryForm');
  var okBox = doc.getElementById('formOk');

  function setError(field, message) {
    var wrap = field.closest('.field');
    var err = wrap ? wrap.querySelector('.field__err') : null;
    if (wrap) { wrap.classList.toggle('is-invalid', Boolean(message)); }
    if (err) { err.textContent = message || ''; }
  }

  function validate() {
    var issues = [];
    if (!form) { return issues; }

    var name = doc.getElementById('f-name');
    var email = doc.getElementById('f-email');
    var type = doc.getElementById('f-type');
    var msg = doc.getElementById('f-msg');

    if (name) {
      if (!name.value.trim()) { setError(name, 'Please tell us your name.'); issues.push(name); }
      else { setError(name, ''); }
    }

    if (email) {
      var v = email.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (!v) { setError(email, 'An email address is required.'); issues.push(email); }
      else if (!valid) { setError(email, 'That email address looks incomplete.'); issues.push(email); }
      else { setError(email, ''); }
    }

    if (type) {
      if (!type.value) { setError(type, 'Please choose a project type.'); issues.push(type); }
      else { setError(type, ''); }
    }

    if (msg) {
      if (msg.value.trim().length < 12) {
        setError(msg, 'A sentence or two is plenty — just enough to go on.');
        issues.push(msg);
      } else { setError(msg, ''); }
    }

    return issues;
  }

  if (form) {
    /* live-clear an error as soon as the field is corrected */
    ['f-name', 'f-email', 'f-type', 'f-msg'].forEach(function (id) {
      var el = doc.getElementById(id);
      if (!el) { return; }
      el.addEventListener('input', function () {
        var wrap = el.closest('.field');
        if (wrap && wrap.classList.contains('is-invalid')) { setError(el, ''); }
      });
      el.addEventListener('change', function () {
        var wrap = el.closest('.field');
        if (wrap && wrap.classList.contains('is-invalid')) { setError(el, ''); }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var issues = validate();

      if (issues.length) {
        issues[0].focus();
        if (okBox) { okBox.hidden = true; }
        return;
      }

      var get = function (id) {
        var el = doc.getElementById(id);
        return el ? el.value.trim() : '';
      };

      var body = [
        'Name: ' + get('f-name'),
        'Email: ' + get('f-email'),
        'Company: ' + (get('f-company') || '—'),
        'Country / region: ' + (get('f-country') || '—'),
        'Project type: ' + get('f-type'),
        'Budget: ' + (get('f-budget') || 'Not specified'),
        '',
        'Brief:',
        get('f-msg'),
        '',
        '— sent from teamwireframe.studio'
      ].join('\n');

      var subject = 'Project enquiry — ' + get('f-type') + ' — ' + get('f-name');
      var mailto = 'mailto:hello@teamwireframe.studio'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);

      if (okBox) { okBox.hidden = false; }
      window.location.href = mailto;
    });
  }
})();
