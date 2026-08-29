const defaultProjects = [];
const defaultFeedback = [
  { id: 1, name: 'Happy Client', quote: 'The team was professional, clear about every stage, and delivered a home our family loves.' },
  { id: 2, name: 'Business Owner', quote: 'Reliable work, good communication, and excellent attention to detail from start to finish.' }
];
const adminEmail = 'mohithtk73@gmail.com';
const adminPassword = 'rkconstructionkiruba0805+-';
const read = (key, fallback) => JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const projects = () => read('rk-projects', defaultProjects);
const feedback = () => read('rk-feedback', defaultFeedback);
const esc = text => String(text).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function renderProjects(filter = 'all') {
  const target = document.querySelector('#project-list'); if (!target) return;
  const items = projects().filter(p => filter === 'all' || p.status === filter);
  target.innerHTML = items.length ? items.map(p => `<article class="project"><div class="project-visual">⌂</div><div class="project-body"><span class="project-status">${esc(p.status)}</span><h3>${esc(p.name)}</h3><p>${esc(p.location)}</p><div class="progress-line"><span style="width:${Math.max(0, Math.min(100, p.progress))}%"></span></div><div class="progress-label"><span>Construction progress</span><strong>${p.progress}%</strong></div></div></article>`).join('') : '<p class="empty">No projects in this category yet.</p>';
}
function renderFeedback() { const target = document.querySelector('#testimonial-list'); if (target) target.innerHTML = feedback().map(f => `<article class="testimonial"><blockquote>“${esc(f.quote)}”</blockquote><cite>— ${esc(f.name)}</cite></article>`).join(''); }
function renderAdmin() { const p = document.querySelector('#admin-project-list'), f = document.querySelector('#admin-feedback-list'); if (!p) return; p.innerHTML = projects().map(x => `<div class="admin-project"><div><h3>${esc(x.name)}</h3><p>${esc(x.status)} · ${x.progress}%</p></div><button class="delete" data-delete-project="${x.id}">Delete</button></div>`).join('') || '<p>No projects yet.</p>'; f.innerHTML = feedback().map(x => `<div class="admin-project"><div><h3>${esc(x.name)}</h3><p>${esc(x.quote)}</p></div><button class="delete" data-delete-feedback="${x.id}">Delete</button></div>`).join('') || '<p>No feedback yet.</p>'; }

document.querySelector('#year')?.append(new Date().getFullYear());
document.querySelector('.menu-button')?.addEventListener('click', e => { const nav = document.querySelector('nav'); nav.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', nav.classList.contains('open')); });
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.filter').forEach(x => x.classList.remove('active')); button.classList.add('active'); renderProjects(button.dataset.filter); }));
document.querySelector('#contact-form')?.addEventListener('submit', e => { e.preventDefault(); e.currentTarget.reset(); e.currentTarget.querySelector('.form-message').textContent = 'Thank you—your enquiry has been recorded. We will contact you soon.'; });
document.querySelector('#login-form')?.addEventListener('submit', e => { e.preventDefault(); const form = e.currentTarget; const email = form.querySelector('[name="email"]').value.trim().toLowerCase(); const password = form.querySelector('[name="password"]').value; const okay = email === adminEmail && password === adminPassword; if (okay) { document.querySelector('#login-panel').classList.add('hidden'); document.querySelector('#dashboard').classList.remove('hidden'); renderAdmin(); } else form.querySelector('.form-message').textContent = 'Incorrect Gmail or password. Please try again.'; });
document.querySelector('#project-form')?.addEventListener('submit', e => { e.preventDefault(); const d = new FormData(e.currentTarget); const data = projects(); data.unshift({ id: Date.now(), name:d.get('name'), location:d.get('location'), status:d.get('status'), progress:Number(d.get('progress')) }); write('rk-projects',data); e.currentTarget.reset(); renderAdmin(); });
document.querySelector('#feedback-form')?.addEventListener('submit', e => { e.preventDefault(); const d = new FormData(e.currentTarget); const data = feedback(); data.unshift({id:Date.now(),name:d.get('name'),quote:d.get('quote')}); write('rk-feedback',data); e.currentTarget.reset(); renderAdmin(); });
document.addEventListener('click', e => { const projectId = e.target.dataset.deleteProject, feedbackId = e.target.dataset.deleteFeedback; if (projectId) write('rk-projects', projects().filter(x => x.id !== Number(projectId))); if (feedbackId) write('rk-feedback', feedback().filter(x => x.id !== Number(feedbackId))); if (projectId || feedbackId) renderAdmin(); });
renderProjects(); renderFeedback();
