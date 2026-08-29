// POST /api/enquiry - submit a new enquiry (no admin auth required).
// Uses a honeypot field for spam, rate limiting, validation, durable storage,
// and an optional SMTP email notification to the owner.
const { getEnquiryStore, json, readBody, rateLimited, clientIp } = require('./_helpers');

// Least common denominator XSS-safe sanitizer for plain-text storage.
function clean(value) {
  return String(value == null ? '' : value).replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
  }[c])).trim();
}

function validate(data) {
  const errors = [];
  const name = clean(data.name);
  const phone = clean(data.phone).replace(/[^0-9+ ]/g, '');
  const email = clean(data.email).toLowerCase();
  const projectType = clean(data.projectType);
  const location = clean(data.location);
  const description = clean(data.description);

  if (!name) errors.push('Please enter your name.');
  if (name.length < 2) errors.push('Name must be at least 2 characters.');
  if (phone.length < 7 || phone.length > 15) errors.push('Please enter a valid phone number.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address.');
  if (!/^(phone|email|whatsapp)$/.test(data.preferredContact || '')) errors.push('Please choose a preferred contact method.');

  return { errors, name, phone, email, projectType, location, description };
}

exports.handler = async (event) => {
  // Honeypot: bots fill the website field. Humans never see it.
  const raw = event.body ? JSON.parse(event.body || '{}') : {};
  if (raw.website_field && raw.website_field.length > 0) {
    return json({ ok: true, message: 'Thanks for your enquiry - we will be in touch soon.' }, 201);
  }

  const ip = clientIp(event);
  if (rateLimited(ip)) {
    return json({ ok: false, errors: ['Too many submissions. Please try again a little later.'] }, 429);
  }

  const v = validate(raw);
  if (v.errors.length) {
    return json({ ok: false, errors: v.errors }, 422);
  }

  const enquiry = {
    id: `ENQ-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    name: v.name,
    phone: v.phone,
    email: v.email,
    projectType: v.projectType || 'General enquiry',
    location: v.location || '',
    budget: clean(raw.budget),
    description: v.description || '',
    preferredContact: raw.preferredContact || 'phone',
    status: 'new',
  };

  const store = getEnquiryStore(event);
  let enquiries = [];
  try { enquiries = (await store.get('enquiries', { type: 'json', consistency: 'strong' })) || []; } catch (e) { enquiries = []; }
  enquiries.unshift(enquiry);
  await store.set('enquiries', JSON.stringify(enquiries));

  // Optional email notification to the owner if SMTP is configured.
  if (process.env.SMTP_HOST && process.env.OWNER_EMAIL) {
    try {
      const nodemailer = require('nodemailer');
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
      await transport.sendMail({
        from: process.env.SMTP_FROM || 'RK Creators & Builders <no-reply@example.com>',
        to: process.env.OWNER_EMAIL,
        replyTo: v.email || v.phone,
        subject: `New enquiry ${enquiry.id} - ${v.name}`,
        text: [
          `New website enquiry from RK Creators & Builders`,
          ``,
          `Enquiry ID: ${enquiry.id}`,
          `Date/Time: ${enquiry.createdAt}`,
          ``,
          `Name: ${v.name}`,
          `Phone: ${v.phone}`,
          `Email: ${v.email || 'not provided'}`,
          `Project type: ${enquiry.projectType}`,
          `Location: ${v.location || 'not provided'}`,
          `Budget: ${clean(raw.budget) || 'not provided'}`,
          `Preferred contact: ${enquiry.preferredContact}`,
          ``,
          `Description:`,
          v.description || '-',
        ].join('\n'),
      });
    } catch (e) {
      // Email failure must not block the enquiry from being stored.
      // It remains fully visible in the admin dashboard.
    }
  }

  return json({ ok: true, message: 'Thank you! Your enquiry has been received. We will contact you soon.', id: enquiry.id }, 201);
};
