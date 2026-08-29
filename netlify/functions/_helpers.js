// Shared helpers for Netlify Functions (enquiry system).
const { getStore, connectLambda } = require('@netlify/blobs');

// Durable blob store used to persist enquiries. Netlify Blobs persist across
// function invocations (unlike the filesystem), giving us a real, secure store.
const STORE_NAME = 'enquiries-store';
const PROJECTS_STORE = 'projects-store';

// v1-style exported handlers receive blob access credentials on the Lambda
// event (`event.blobs` + site headers). Wiring them with `connectLambda` makes
// the same code work locally (`netlify dev`) and in production.
//
// connectLambda() keeps only the eventually-consistent edge URL. The raw blob
// payload also carries `url_uncached` (strongly consistent endpoint); we
// recover it here and return strong-consistency settings for the caller.
function connectBlobs(event) {
  if (!event || !event.blobs) return {};
  const config = {};
  if (process.env.LOCAL_BLOBS_DIRECTORY) {
    // Local `netlify dev` blob server.
    connectLambda(event);
    config.region = 'auto';
    return config;
  }
  connectLambda(event);
  config.consistency = 'strong';
  try {
    const data = JSON.parse(Buffer.from(event.blobs, 'base64').toString('utf8'));
    if (data.url_uncached) config.uncachedEdgeURL = data.url_uncached;
  } catch (e) { /* fall back to the default edge URL */ }
  return config;
}

function getEnquiryStore(event) {
  const config = connectBlobs(event);
  return getStore({ name: STORE_NAME, siteID: process.env.NETLIFY_SITE_ID, ...config });
}

function getProjectsStore(event) {
  const config = connectBlobs(event);
  return getStore({ name: PROJECTS_STORE, siteID: process.env.NETLIFY_SITE_ID, ...config });
}

// Projects shipped with the site (optional seed data). The admin panel manages
// projects in the blob store; this file acts as the fallback/seed source.
function baseProjects() {
  let raw = {};
  try { raw = require('../../data/projects.json'); } catch (e) { raw = {}; }
  return Array.isArray(raw) ? raw : (raw && Array.isArray(raw.projects) ? raw.projects : []);
}

// Compare a client-supplied token against the server-side ADMIN_TOKEN.
// Keeps secret on the server only - never in the frontend.
function hasAdminToken(requestBody) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const provided = requestBody && (requestBody.token || requestBody.accessToken);
  if (!provided) return false;
  // Constant-time-ish comparison
  let diff = expected.length ^ String(provided).length;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ String(provided).charCodeAt(i);
  }
  return diff === 0;
}

function json(body, status = 200) {
  // Legacy shape is compatible with both the Netlify production runtime and
  // `netlify dev`.
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}

function readBody(event) {
  return new Promise((resolve) => {
    if (event.body) {
      let raw = event.body;
      if (raw instanceof Uint8Array) raw = Buffer.from(raw).toString('utf8');
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    } else { resolve({}); }
  });
}

// Simple in-memory rate limiting per-IP to reduce spam/abuse.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const max = 3; // max submissions per IP per window
  const entry = hits.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > windowMs) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  hits.set(ip, entry);
  return entry.count > max;
}

function clientIp(event) {
  const fwd = event.headers['x-forwarded-for'] || event.headers['x-client-ip'];
  return fwd ? String(fwd).split(',')[0].trim() : 'unknown';
}

module.exports = { getEnquiryStore, getProjectsStore, baseProjects, hasAdminToken, json, readBody, rateLimited, clientIp };
