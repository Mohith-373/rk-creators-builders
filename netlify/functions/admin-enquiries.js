// POST /api/admin/enquiries - list enquiries. Requires ADMIN_TOKEN.
const { getEnquiryStore, hasAdminToken, json, readBody } = require('./_helpers');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
  const body = await readBody(event);
  if (!hasAdminToken(body)) return json({ ok: false, error: 'Unauthorized' }, 401);

  const store = getEnquiryStore(event);
  let enquiries = [];
  try { enquiries = (await store.get('enquiries', { type: 'json', consistency: 'strong' })) || []; } catch (e) { enquiries = []; }

  const statusFilter = body.status || 'all';
  const filtered = statusFilter === 'all'
    ? enquiries
    : enquiries.filter((e) => e.status === statusFilter);

  return json({ ok: true, enquiries: filtered.filter((e) => e.status !== '__deleted__') });
};
