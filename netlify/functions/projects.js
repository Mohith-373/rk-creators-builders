// GET /api/projects - public list of residential projects.
// Projects are managed by the admin panel (Netlify Blobs) and seeded by
// data/projects.json. Managed projects take priority; the file is the fallback.
const { json, getProjectsStore, baseProjects } = require('./_helpers');

exports.handler = async (event) => {
  const qp = event.queryStringParameters || {};
  const status = qp.status;

  let projects = null;
  try {
    const store = getProjectsStore(event);
    projects = (await store.get('projects', { type: 'json', consistency: 'strong' })) || null;
  } catch (e) {
    projects = null;
  }
  if (!Array.isArray(projects)) projects = baseProjects();

  const list = status ? projects.filter((p) => p.status === status) : projects;
  return json({ ok: true, projects: list }, 200);
};