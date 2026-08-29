// Admin dashboard: protected enquiry AND project management.
// The admin token is verified server-side against ADMIN_TOKEN and kept in
// sessionStorage - never in the page source.
(function () {
  'use strict';
  var loginView = document.getElementById('login-view');
  var dash = document.getElementById('dashboard-view');
  var loginForm = document.getElementById('login-form');
  var loginMsg = document.getElementById('login-msg');

  // ---- Enquiries refs ----
  var listEl = document.getElementById('enquiry-list');
  var emptyEl = document.getElementById('empty-enquiries');
  var summaryEl = document.getElementById('summary');

  // ---- Projects refs ----
  var pjList = document.getElementById('project-list-admin');
  var pjEmpty = document.getElementById('project-empty');
  var pjFormCard = document.getElementById('project-form-card');
  var pjFormTitle = document.getElementById('project-form-title');
  var pjFormMsg = document.getElementById('pj-form-msg');
  var pjProgressField = document.getElementById('pj-progress-field');

  var token = null;
  var enquiries = [];
  var filter = 'all';
  var projects = [];
  var editingId = null;

  var PROJECT_TYPES = [
    'New Home Construction',
    'Custom Home Building',
    'Home Renovation & Remodeling',
    'Home Extensions & Modifications',
    'Architectural Planning & Design',
    'Inspection & Repairs',
    'Other',
  ];

  function show(type, el, msg) {
    el.className = 'form-msg ' + type;
    el.innerHTML = msg;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function authBody(extra) { var o = extra || {}; o.token = token; return JSON.stringify(o); }
  function api(path, body) {
    return fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body }).then(function (r) {
      return r.json().then(function (d) { return { ok: d.ok, status: r.status, data: d }; });
    });
  }

  // ================= LOGIN =================
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var pass = loginForm.querySelector('[name="password"]').value;
      api('/.netlify/functions/admin-login', JSON.stringify({ password: pass })).then(function (r) {
        if (r.ok && r.data.token) {
          token = r.data.token;
          try { sessionStorage.setItem('rk_admin_token', token); } catch (err) {}
          enterDashboard();
        } else {
          show('error', loginMsg, 'Incorrect password. Please try again.');
        }
      }).catch(function () {
        show('error', loginMsg, 'Network error. Please try again.');
      });
    });
  }

  function enterDashboard() {
    loginView.classList.add('hide');
    dash.classList.remove('hide');
    loadEnquiries();
  }

  // Try restoring a session from this browser tab.
  function restoreSession() {
    try {
      var saved = sessionStorage.getItem('rk_admin_token');
      if (saved && dash) { token = saved; enterDashboard(); }
    } catch (err) {}
  }
  restoreSession();

  function resetToLogin() {
    token = null;
    try { sessionStorage.removeItem('rk_admin_token'); } catch (err) {}
    dash.classList.add('hide');
    loginView.classList.remove('hide');
  }

  // ================= TABS =================
  document.querySelectorAll('.admin-tab[data-view]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var view = tab.getAttribute('data-view');
      document.querySelectorAll('.admin-tab[data-view]').forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.getElementById('view-enquiries').classList.toggle('hide', view !== 'enquiries');
      document.getElementById('view-projects').classList.toggle('hide', view !== 'projects');
      if (view === 'projects') loadProjects();
    });
  });

  // Log out
  document.querySelector('[data-action="logout"]').addEventListener('click', function () {
    resetToLogin();
  });

  // ================= ENQUIRIES =================
  function renderEnquiries() {
    var list = enquiries.filter(function (e) { return filter === 'all' || e.status === filter; });
    if (!list.length) { emptyEl.classList.remove('hide'); listEl.innerHTML = ''; }
    else {
      emptyEl.classList.add('hide');
      listEl.innerHTML = list.map(function (e) {
        return (
          '<div class="enq">' +
            '<div class="enq-top">' +
              '<div><strong>' + esc(e.name) + '</strong> &nbsp; <span class="enq-tag ' + esc(e.status) + '">' + esc(e.status) + '</span></div>' +
              '<span class="enq-time">' + fmtDate(e.createdAt) + '</span>' +
            '</div>' +
            '<div class="enq-body">' +
              '<p><strong>Enquiry:</strong> ' + esc(e.id) + '</p>' +
              '<p><strong>Phone:</strong> <a href="tel:+' + esc(e.phone) + '">' + esc(e.phone) + '</a>' + (e.whatsapp ? ' Â· <a href="https://wa.me/' + esc(e.whatsapp) + '" target="_blank" rel="noopener">WhatsApp</a>' : '') + '</p>' +
              (e.email ? '<p><strong>Email:</strong> <a href="mailto:' + esc(e.email) + '">' + esc(e.email) + '</a></p>' : '') +
              '<p><strong>Project type:</strong> ' + esc(e.projectType) + '</p>' +
              (e.location ? '<p><strong>Location:</strong> ' + esc(e.location) + '</p>' : '') +
              (e.budget ? '<p><strong>Budget:</strong> ' + esc(e.budget) + '</p>' : '') +
              '<p><strong>Preferred contact:</strong> ' + esc(e.preferredContact) + '</p>' +
              '<p><strong>Message:</strong> ' + esc(e.description) + '</p>' +
            '</div>' +
            '<div class="enq-actions">' +
              (e.status !== 'new' ? '<button class="btn btn-sm btn-outline" data-action="new" data-id="' + esc(e.id) + '">Mark new</button>' : '') +
              (e.status !== 'contacted' ? '<button class="btn btn-sm btn-outline" data-action="contacted" data-id="' + esc(e.id) + '">Mark contacted</button>' : '') +
              (e.status !== 'completed' ? '<button class="btn btn-sm btn-outline" data-action="completed" data-id="' + esc(e.id) + '">Mark completed</button>' : '') +
              '<button class="btn btn-sm" style="background:#9c3a27;color:#fff" data-action="delete" data-id="' + esc(e.id) + '">Delete</button>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }

    var counts = { new: 0, contacted: 0, completed: 0 };
    enquiries.forEach(function (e) { if (counts[e.status] != null) counts[e.status]++; });
    summaryEl.innerHTML =
      '<div class="summary-card"><b>' + enquiries.length + '</b><span>Total enquiries</span></div>' +
      '<div class="summary-card"><b>' + counts.new + '</b><span>New</span></div>' +
      '<div class="summary-card"><b>' + counts.contacted + '</b><span>Contacted</span></div>' +
      '<div class="summary-card"><b>' + counts.completed + '</b><span>Completed</span></div>';
  }

  function loadEnquiries() {
    api('/.netlify/functions/admin-enquiries', authBody()).then(function (r) {
      if (r.ok) { enquiries = r.data.enquiries || []; renderEnquiries(); }
      else { resetToLogin(); }
    }).catch(function () { /* keep whatever we have */ });
  }

  // ================= PROJECTS =================
  function typeLabel(t) { return t || 'Residential'; }

  function renderProjects() {
    if (!projects.length) {
      pjList.innerHTML = '';
      pjEmpty.classList.remove('hide');
      return;
    }
    pjEmpty.classList.add('hide');
    pjList.innerHTML = projects.map(function (p) {
      var cover = (p.images && p.images[0]) || '';
      var imgStyle = cover ? 'background-image:url("' + esc(cover) + '")' : '';
      var statusTag = p.status === 'ongoing'
        ? '<span class="enq-tag ongoing">Ongoing</span>'
        : '<span class="enq-tag completed">Completed</span>';
      var progress = p.status === 'ongoing'
        ? '<div class="pj-progress-renew show"><small><span>Progress</span><strong>' + (p.progress || 0) + '%</strong></small><div class="pj-progress-bar"><span style="width:' + (p.progress || 0) + '%"></span></div></div>'
        : '';
      return (
        '<div class="pj">' +
          '<div class="pj-thumb" style="' + imgStyle + '" role="img" aria-label="' + esc(p.name) + ' cover photo"></div>' +
          '<div class="pj-body">' +
            '<div class="pj-top">' +
              '<div><h4>' + esc(p.name) + '</h4>' +
                '<div class="pj-meta">' + esc(typeLabel(p.projectType)) + (p.location ? ' Â· ' + esc(p.location) : '') + '</div>' +
                '<div class="pj-meta">' + (p.startDate ? 'Started ' + esc(p.startDate) : '') + (p.finishDate ? ' Â· Completed ' + esc(p.finishDate) : '') + '</div>' +
              '</div>' +
              statusTag +
            '</div>' +
            progress +
            '<div class="pj-actions">' +
              '<button class="btn btn-sm btn-outline" data-pj-action="edit" data-id="' + esc(p.id) + '">Edit</button>' +
              '<button class="btn btn-sm" style="background:#9c3a27;color:#fff" data-pj-action="delete" data-id="' + esc(p.id) + '">Delete</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function loadProjects() {
    api('/.netlify/functions/admin-projects', authBody({ action: 'list' })).then(function (r) {
      if (!r.ok) { resetToLogin(); return; }
      projects = r.data.projects || [];
      if (editingId && !projects.some(function (p) { return p.id === editingId; })) closeProjectForm();
      renderProjects();
    }).catch(function () {});
  }

  function closeProjectForm() {
    editingId = null;
    pjFormCard.classList.add('hide');
    document.getElementById('project-form').reset();
    pjFormMsg.className = 'pj-form-msg';
    pjFormMsg.innerHTML = '';
    document.getElementById('pj-save-btn').disabled = false;
    document.getElementById('pj-save-btn').textContent = 'Save Project';
  }

  function openProjectForm(p) {
    editingId = p ? p.id : null;
    pjFormTitle.textContent = p ? 'Edit Project' : 'Add Project';
    pjFormCard.classList.remove('hide');
    pjFormMsg.className = 'pj-form-msg';
    pjFormMsg.innerHTML = '';

    var form = document.getElementById('project-form');
    form.reset();
    form.name.value = p ? p.name : '';
    form.projectType.value = p ? p.projectType : PROJECT_TYPES[0];
    if (form.projectType.value === 'Other' && p && p.projectType && PROJECT_TYPES.indexOf(p.projectType) === -1) {
      form.projectType.value = 'Other';
    }
    form.status.value = p ? p.status : 'completed';
    form.progress.value = p && p.status === 'ongoing' ? (p.progress || 0) : '';
    form.location.value = p ? (p.location || '') : '';
    form.startDate.value = p ? (p.startDate || '') : '';
    form.finishDate.value = p ? (p.finishDate || '') : '';
    form.description.value = p ? (p.description || '') : '';
    form.scope.value = (p && p.scope ? p.scope : []).join('\n');
    form.highlights.value = (p && p.highlights ? p.highlights : []).join('\n');
    form.images.value = (p && p.images ? p.images : []).join('\n');

    toggleProgressField(form.status.value);
    pjFormCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    form.name.focus();
  }

  function toggleProgressField(status) {
    pjProgressField.style.display = status === 'ongoing' ? 'flex' : 'none';
  }

  function splitLines(value) {
    return String(value || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function collectProject() {
    var form = document.getElementById('project-form');
    var status = form.status.value === 'ongoing' ? 'ongoing' : 'completed';
    return {
      id: editingId || '',
      name: form.name.value.trim(),
      status: status,
      progress: form.progress.value,
      projectType: form.projectType.value,
      location: form.location.value.trim(),
      startDate: form.startDate.value.trim(),
      finishDate: form.finishDate.value.trim(),
      description: form.description.value.trim(),
      scope: splitLines(form.scope.value),
      highlights: splitLines(form.highlights.value),
      images: splitLines(form.images.value),
    };
  }

  function saveProjectFromForm() {
    var project = collectProject();
    if (project.name.length < 2) {
      showPjMsg('error', 'Please enter the project name.');
      return;
    }
    if (project.description.length < 10) {
      showPjMsg('error', 'Please add a short project description (a sentence or two).');
      return;
    }
    var btn = document.getElementById('pj-save-btn');
    btn.disabled = true;
    btn.textContent = 'Savingâ€¦';

    api('/.netlify/functions/admin-projects', authBody({ action: 'save', project: project })).then(function (r) {
      if (!r.ok) {
        if (r.status === 401) { resetToLogin(); return; }
        showPjMsg('error', (r.data && (r.data.error || r.data.errors)) || 'Something went wrong. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Save Project';
        return;
      }
      projects = r.data.projects || [];
      renderProjects();
      closeProjectForm();
      var list = document.getElementById('view-projects');
      pjFormMsg.className = 'pj-form-msg success';
      pjFormMsg.innerHTML = '<strong>Saved!</strong> The project now appears on your website.';
    }).catch(function () {
      showPjMsg('error', 'Network error. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Save Project';
    });
  }

  function showPjMsg(type, html) {
    pjFormMsg.className = 'pj-form-msg ' + type;
    pjFormMsg.innerHTML = html;
  }

  document.getElementById('project-form').addEventListener('submit', function (e) {
    e.preventDefault();
    saveProjectFromForm();
  });
  document.getElementById('pj-status').addEventListener('change', function () {
    toggleProgressField(this.value);
  });
  document.getElementById('pj-cancel-btn').addEventListener('click', closeProjectForm);
  document.getElementById('add-project-btn').addEventListener('click', function () { openProjectForm(null); });
  document.getElementById('refresh-projects-btn').addEventListener('click', loadProjects);

  // Project list actions (delegated)
  pjList.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-pj-action]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    var action = btn.getAttribute('data-pj-action');

    if (action === 'edit') {
      var p = projects.filter(function (x) { return String(x.id) === String(id); })[0];
      if (p) openProjectForm(p);
      return;
    }
    if (action === 'delete' && !confirm('Delete this project permanently?')) return;

    api('/.netlify/functions/admin-projects', authBody({ action: 'delete', id: id })).then(function (r) {
      if (!r.ok) {
        if (r.status === 401) { resetToLogin(); return; }
        return;
      }
      projects = r.data.projects || [];
      renderProjects();
    });
  });

  // ================= ENQUIRY FILTERS + ACTIONS =================
  document.querySelectorAll('.status-filters .filter-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.status-filters .filter-chip').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      filter = chip.dataset.status;
      renderEnquiries();
    });
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.dataset.action;
    var id = btn.dataset.id;

    if (action === 'delete' && !confirm('Delete this enquiry permanently?')) return;

    var body = { id: id };
    if (action !== 'delete') body.status = action;
    body.action = action;

    api('/.netlify/functions/admin-enquiry-status', authBody(body)).then(function (r) {
      if (r.ok) { loadEnquiries(); }
      else if (r.status === 401 || (r.data && r.data.error === 'Unauthorized')) { resetToLogin(); }
    });
  });
})();
