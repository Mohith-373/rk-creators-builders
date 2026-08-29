// Common behaviour injected on every page: nav toggle, shared header/footer,
// reveal-on-scroll, sticky mobile bar, and footer year.
(function (window, document) {
  'use strict';

  var SITE = window.SITE || {};

  // Build nav links. "active" is injected per-page via a data attribute on <body>.
  function navLinks(active) {
    var links = [
      ['index.html', 'Home'],
      ['about.html', 'About'],
      ['services.html', 'Services'],
      ['projects.html', 'Projects'],
      ['process.html', 'Our Process'],
      ['contact.html', 'Contact']
    ];
    return links.map(function (l) {
      var cls = l[0] === active ? 'aria-current="page"' : '';
      return '<a href="' + l[0] + '" ' + cls + '>' + l[1] + '</a>';
    }).join('\n') + '\n<a class="btn" href="contact.html#enquiry">Request a Quote</a>';
  }

  function brandHtml(sub) {
    return (
      '<a class="brand" href="index.html" aria-label="' + (SITE.name || 'RK Creators and Builders') + ' home">' +
        '<span class="brand-logo"><img src="logo.jpg" alt="RK Creators &amp; Builders logo"></span>' +
        '<span class="brand-text"><strong>RK Creators &amp; Builders</strong><span>Residential Construction</span></span>' +
      '</a>'
    );
  }

  function footerHtml() {
    var footLinks = {
      'Company': [['index.html', 'Home'], ['about.html', 'About Us'], ['services.html', 'Services'], ['projects.html', 'Projects']],
      'Support': [['process.html', 'Our Process'], ['contact.html', 'Contact'], ['privacy.html', 'Privacy Policy']]
    };
    var cols = Object.keys(footLinks).map(function (title) {
      var items = footLinks[title].map(function (l) { return '<li><a href="' + l[0] + '">' + l[1] + '</a></li>'; }).join('');
      return '<div><h4>' + title + '</h4><ul>' + items + '</ul></div>';
    }).join('');
    var phones = (SITE.phones || []).map(function (p) {
      return '<li><a href="tel:' + p.tel + '">' + p.label + '</a></li>';
    }).join('');
    return (
      '<div class="footer-grid wrap">' +
        '<div class="footer-brand">' + brandHtml() +
          '<p>' + (SITE.statement || '') + '</p>' +
        '</div>' +
        cols +
        '<div><h4>Contact</h4><ul>' + phones +
          '<li><a href="mailto:' + (SITE.email || '') + '">' + (SITE.email || '') + '</a></li>' +
          '<li>' + (SITE.location ? SITE.location.line1 + ', ' + SITE.location.city : '') + '</li>' +
        '</ul></div>' +
      '</div>' +
      '<div class="footer-bottom wrap">' +
        '<p>&copy; <span data-year></span> RK Creators &amp; Builders. All rights reserved.</p>' +
        '<nav><a href="privacy.html">Privacy Policy</a><a href="contact.html">Contact</a></nav>' +
      '</div>'
    );
  }

  function stickyBar() {
    var phones = SITE.phones || [];
    var call = phones[0] ? phones[0].tel : '#';
    return (
      '<a class="call" href="tel:' + call + '" aria-label="Call us">' + iconPhone() + ' Call</a>' +
      '<a class="whats" href="https://wa.me/' + (SITE.whatsapp || '') + '?text=' + encodeURIComponent('Hello, I would like to enquire about a residential construction project.') + '" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">' + iconWhats() + ' WhatsApp</a>' +
      '<a class="enq" href="contact.html#enquiry">Enquire</a>'
    );
  }

  function iconPhone() { return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>'; }
  function iconWhats() { return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.9-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.5 7.5 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.5c.1-.2.1-.3.2-.5 0-.2 0-.4-.1-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.9 2.9 4.6 4.1.6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.1-.5-.2z"/></svg>'; }

  function init() {
    var active = document.body.getAttribute('data-page') || '';
    var header = document.getElementById('site-header');
    var main = document.getElementById('site-main');
    var footer = document.getElementById('site-footer');

    if (header) {
      header.innerHTML =
        '<div class="header-inner wrap">' + brandHtml() +
          '<button class="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="site-nav">' +
            '<span></span><span></span><span></span>' +
          '</button>' +
          '<nav class="nav" id="site-nav">' + navLinks(active) + '</nav>' +
        '</div>';
    }
    if (footer) { footer.innerHTML = footerHtml(); }

    // Sticky mobile bar (before footer for correct layout flow)
    var sticky = document.createElement('div');
    sticky.className = 'sticky-bar';
    sticky.innerHTML = stickyBar();
    document.body.appendChild(sticky);

    // Mobile nav toggle
    var toggle = document.querySelector('.nav-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var nav = document.getElementById('site-nav');
        var open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) { nav.querySelector('a').focus(); }
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var n = document.getElementById('site-nav'); if (n && n.classList.contains('open')) { n.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); } } });
    }

    // Year
    var yearEl = document.querySelector('[data-year]');
    if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

    // Reveal on scroll
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(function (r) { io.observe(r); });
    } else {
      reveals.forEach(function (r) { r.classList.add('in'); });
    }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})(window, document);
