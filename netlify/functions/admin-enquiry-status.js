// POST /api/admin/enquiry-status - update or delete an enquiry. Requires ADMIN_TOKEN.
const { getEnquiryStore, hasAdminToken, json, readBody } = require('./_helpers');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
  const body = await readBody(event);
  if (!hasAdminToken(body)) return json({ ok: false, error: 'Unauthorized' }, 401);

  const id = body.id;
  if (!id) return json({ ok: false, error: 'Missing enquiry id' }, 400);

  const store = getEnquiryStore(event);
  let enquiries = [];
  try { enquiries = (await store.get('enquiries', { type: 'json', consistency: 'strong' })) || []; } catch (e) { enquiries = []; }

  const idx = enquiries.findIndex((e) => e.id === id);
  if (idx === -1) return json({ ok: false, error: 'Enquiry not found' }, 404);

  if (body.action === 'delete') {
    enquiries.splice(idx, 1);
  } else {
    const status = body.status;
    if (!['new', 'contacted', 'completed'].includes(status)) {
      return json({ ok: false, error: 'Invalid status' }, 400);
    }
    enquiries[idx].status = status;
    enquiries[idx].updatedAt = new Date().toISOString();
  }

  await store.set('enquiries', JSON.stringify(enquiries));
  return json({ ok: true });
};
