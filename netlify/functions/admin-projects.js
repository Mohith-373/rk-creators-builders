// POST /api/admin/projects - list, save, or delete residential projects.
// Requires ADMIN_TOKEN. Data persists in Netlify Blobs and is served to the
// public site by /api/projects.
const { getProjectsStore, baseProjects, hasAdminToken, json, readBody } = require('./_helpers');

const PROJECT_TYPES = [
  'New Home Construction',
  'Custom Home Building',
  'Home Renovation & Remodeling',
  'Home Extensions & Modifications',
  'Architectural Planning & Design',
  'Inspection & Repairs',
  'Other',
];

const MAX_TEXT = 4000;

function clean(value) {
  return String(value == null ? '' : value).replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
  }[c])).trim();
}

function cleanList(value, maxItems) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value.slice(0, maxItems)) {
    const s = clean(item);
    if (s) out.push(s);
  }
  return out;
}

function cleanImages(value, maxItems) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value.slice(0, maxItems)) {
    const s = clean(item);
    if (/^https?:\/\//i.test(s)) out.push(s);
  }
  return out;
}

function slugify(name) {
  return String(name).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'project';
}

function sanitizeProject(data, existingId) {
  const name = clean(data.name).slice(0, 120);
  const status = data.status === 'ongoing' ? 'ongoing' : 'completed';
  const projectType = clean(data.projectType).slice(0, 80) || 'Other';
  const location = clean(data.location).slice(0, 120);
  const description = clean(data.description).slice(0, MAX_TEXT);
  const progress = status === 'ongoing'
    ? Math.max(0, Math.min(100, Math.round(Number(data.progress) || 0)))
    : 100;

  let id = clean(existingId);
  if (!id) id = slugify(name) + '-' + Date.now().toString(36).slice(-5);
  id = id.replace(/[^a-z0-9-]/gi, '');

  return {
    id,
    name,
    status,
    projectType,
    location,
    startDate: clean(data.startDate).slice(0, 40),
    finishDate: clean(data.finishDate).slice(0, 40),
    progress,
    description,
    scope: cleanList(data.scope, 40),
    highlights: cleanList(data.highlights, 40),
    images: cleanImages(data.images, 8),
  };
}

async function loadAll(store) {
  let list = null;
  try { list = (await store.get('projects', { type: 'json', consistency: 'strong' })) || null; } catch (e) { list = null; }
  return Array.isArray(list) ? list : baseProjects();
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
  const body = await readBody(event);
  if (!hasAdminToken(body)) return json({ ok: false, error: 'Unauthorized' }, 401);

  const action = body.action || 'list';

  if (action === 'list') {
    const store = getProjectsStore(event);
    const projects = await loadAll(store);
    return json({ ok: true, projects });
  }

  if (action === 'save') {
    const data = body.project || {};
    if (!clean(data.name)) {
      return json({ ok: false, error: 'Project name is required.' }, 422);
    }
    const store = getProjectsStore(event);
    const projects = await loadAll(store);
    const project = sanitizeProject(data, data.id);
    const index = projects.findIndex((p) => p.id === project.id);
    if (index === -1) projects.unshift(project);
    else projects[index] = project;
    await store.set('projects', JSON.stringify(projects));
    return json({ ok: true, project, projects });
  }

  if (action === 'delete') {
    const id = clean(body.id);
    if (!id) return json({ ok: false, error: 'Missing project id' }, 400);
    const store = getProjectsStore(event);
    const projects = await loadAll(store);
    const next = projects.filter((p) => p.id !== id);
    if (next.length === projects.length) {
      return json({ ok: false, error: 'Project not found' }, 404);
    }
    await store.set('projects', JSON.stringify(next));
    return json({ ok: true, projects: next });
  }

  return json({ ok: false, error: 'Unknown action' }, 400);
};
