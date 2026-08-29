// Renders the first 3 residential projects on the homepage.
(function () {
  'use strict';
  var list = document.getElementById('project-list');
  var empty = document.getElementById('project-empty');
  if (!list) return;

  function typeLabel(t) { return t || 'Residential'; }

  function render(projects) {
    if (!projects.length) {
      list.classList.add('hidden');
      if (empty) empty.classList.remove('hidden');
      return;
    }
    list.innerHTML = projects.slice(0, 3).map(function (p) {
      var img = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=70';
      var statusTag = p.status === 'ongoing'
        ? '<span class="tag status ongoing-soft">Ongoing</span>'
        : '<span class="tag status">Completed</span>';
      var progress = p.status === 'ongoing'
        ? '<div class="progress"><div class="progress-top"><span>Construction progress</span><strong>' + (p.progress || 0) + '%</strong></div><div class="progress-bar"><span style="width:' + (p.progress || 0) + '%"></span></div></div>'
        : '';
      return (
        '<article class="project-card reveal in">' +
          '<a href="project.html?id=' + encodeURIComponent(p.id) + '" style="color:inherit">' +
            '<div class="p-img"><img loading="lazy" src="' + img + '" alt="' + esc(p.name) + ' residential project">' +
              '<div class="p-tags">' + statusTag + '<span class="tag type">' + esc(typeLabel(p.projectType)) + '</span></div></div>' +
            '<div class="p-body"><h3>' + esc(p.name) + '</h3>' +
              '<div class="p-loc"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>' + esc(p.location || '') + '</div>' +
              '<p class="muted">' + esc(truncate(p.description || '', 110)) + '</p>' + progress +
            '</div>' +
          '</a>' +
        '</article>'
      );
    }).join('');
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function truncate(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n).trim() + '…' : s; }

  fetch('/.netlify/functions/projects').then(function (r) { return r.json(); }).then(function (d) {
    if (!d.ok) { list.classList.add('hidden'); if (empty) empty.classList.remove('hidden'); return; }
    render(d.projects || []);
  }).catch(function () {
    list.classList.add('hidden');
    if (empty) empty.classList.remove('hidden');
  });
})();
