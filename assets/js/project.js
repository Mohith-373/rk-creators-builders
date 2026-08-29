// Project detail page: loads a project by ?id= and renders full details.
(function () {
  'use strict';
  var title = document.getElementById('project-title');
  var sub = document.getElementById('project-sub');
  var crumb = document.getElementById('crumb-name');
  var gallery = document.getElementById('project-gallery');
  var body = document.getElementById('project-body');
  if (!title) return;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function typeLabel(t) { return t || 'Residential Project'; }

  function render(p) {
    document.title = p.name + ' | RK Creators & Builders';
    if (crumb) crumb.textContent = p.name;
    title.textContent = p.name;
    sub.textContent = (p.location || 'Location TBC') + ' · ' + typeLabel(p.projectType);

    var images = (p.images && p.images.length) ? p.images : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=70'];
    gallery.innerHTML = images.map(function (src, i) {
      return '<figure style="margin:0" class="reveal in"><img loading="lazy" src="' + src + '" alt="' + esc(p.name) + ' - project image ' + (i + 1) + '" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:6px;box-shadow:0 2px 4px rgba(27,35,41,.08)"><figcaption class="sr-only">' + esc(p.name) + ' project image</figcaption></figure>';
    }).join('');

    var statusHtml = p.status === 'ongoing'
      ? '<span class="tag status ongoing-soft" style="display:inline-block">Ongoing</span>'
      : '<span class="tag status" style="display:inline-block">Completed</span>';

    var progressHtml = p.status === 'ongoing' && (p.progress || 0) > 0
      ? '<div class="progress" style="margin-top:20px"><div class="progress-top"><span>Construction progress</span><strong>' + (p.progress || 0) + '%</strong></div><div class="progress-bar"><span style="width:' + (p.progress || 0) + '%"></span></div></div>'
      : '';

    var scopeHtml = (p.scope && p.scope.length)
      ? '<div style="margin-top:40px"><h3 style="font-size:1.5rem">Scope of work</h3><ul class="check-list" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">' + p.scope.map(function (s) { return '<li><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' + esc(s) + '</li>'; }).join('') + '</ul></div>'
      : '';

    var highlightsHtml = (p.highlights && p.highlights.length)
      ? '<div style="margin-top:40px"><h3 style="font-size:1.5rem">Construction highlights</h3><ul class="check-list">' + p.highlights.map(function (h) { return '<li><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' + esc(h) + '</li>'; }).join('') + '</ul></div>'
      : '';

    body.innerHTML =
      '<div class="two-col no-grow" style="align-items:start">' +
        '<div class="stack">' +
          '<p class="eyebrow">' + statusHtml + '</p>' +
          '<h2>About this project</h2>' +
          '<p class="lead">' + esc(p.description || '') + '</p>' +
          scopeHtml + highlightsHtml +
        '</div>' +
        '<aside style="background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:28px;box-shadow:0 1px 2px rgba(27,35,41,.06)">' +
          '<h3 style="font-size:1.3rem;margin-bottom:18px">Key details</h3>' +
          '<div style="display:grid;gap:16px;font-size:.97rem">' +
            '<div><div style="color:var(--slate);font-size:.82rem;text-transform:uppercase;letter-spacing:.06em">Project type</div><div style="font-weight:600">' + esc(typeLabel(p.projectType)) + '</div></div>' +
            '<div><div style="color:var(--slate);font-size:.82rem;text-transform:uppercase;letter-spacing:.06em">Status</div><div style="font-weight:600">' + (p.status === 'ongoing' ? 'Ongoing' : 'Completed') + '</div></div>' +
            '<div><div style="color:var(--slate);font-size:.82rem;text-transform:uppercase;letter-spacing:.06em">Location</div><div style="font-weight:600">' + esc(p.location || '—') + '</div></div>' +
            (p.startDate ? '<div><div style="color:var(--slate);font-size:.82rem;text-transform:uppercase;letter-spacing:.06em">Started</div><div style="font-weight:600">' + esc(p.startDate) + '</div></div>' : '') +
            (p.finishDate ? '<div><div style="color:var(--slate);font-size:.82rem;text-transform:uppercase;letter-spacing:.06em">Completed</div><div style="font-weight:600">' + esc(p.finishDate) + '</div></div>' : '') +
            progressHtml +
          '</div>' +
        '</aside>' +
      '</div>';

    requestAnimationFrame(function () {
      var els = document.querySelectorAll('#project-body .reveal');
      els.forEach(function (e) { e.classList.add('in'); });
    });
  }

  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');

  fetch('/.netlify/functions/projects').then(function (r) { return r.json(); }).then(function (d) {
    var p = (d.ok && d.projects || []).find(function (x) { return String(x.id) === String(id); });
    if (p) render(p);
    else {
      title.textContent = 'Project not found';
      sub.textContent = 'We couldn\'t find this project. It may have been removed.';
      body.innerHTML = '<p class="muted">Please explore our other <a href="projects.html">projects</a> or <a href="contact.html#enquiry">contact us</a> for more information.</p>';
    }
  }).catch(function () {
    title.textContent = 'Project not found';
    body.innerHTML = '<p class="muted">Please explore our other <a href="projects.html">projects</a>.</p>';
  });
})();
