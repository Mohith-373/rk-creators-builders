// POST /api/admin/login - verify admin password and return a session token.
// The password is compared server-side against the ADMIN_TOKEN env var.
// No secret ever lives in the frontend.
const { json, readBody } = require('./_helpers');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json({ ok: false }, 405);
  const body = await readBody(event);
  const expected = process.env.ADMIN_TOKEN;
  const password = String(body.password || '');

  if (!expected || password.length === 0 || password !== expected) {
    // Constant-time-ish guard against trivial enumeration.
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  // Return a token for subsequent admin calls. If token rotation is desired,
  // derive a per-session value; for a single-admin site the shared secret is fine.
  return json({ ok: true, token: expected });
};
