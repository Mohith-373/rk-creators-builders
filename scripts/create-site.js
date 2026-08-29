// Uses the netlify-cli internals (already authenticated) to create the site.
const NetlifyAPI = require('netlify');
const fs = require('fs');
const os = require('os');
const path = require('path');

// netlify-cli stores its auth token in a configstore file.
function findToken() {
  const probes = [
    path.join(os.homedir(), '.config', 'configstore', 'netlify.json'),
    path.join(os.homedir(), '.netlify', 'config.json'),
    path.join(process.env.APPDATA || '', 'configstore', 'netlify.json'),
    path.join(process.env.LOCALAPPDATA || '', 'configstore', 'netlify.json'),
    path.join(os.homedir(), '.config', 'netlify', 'config.json'),
  ];
  for (const f of probes) {
    try {
      if (fs.existsSync(f)) {
        const cfg = JSON.parse(fs.readFileSync(f, 'utf8'));
        const t = cfg && (cfg.auth || cfg.token || (cfg.user && cfg.user.authToken));
        console.log('Config found at:', f, 'token present:', !!t);
        if (t) return t;
      }
    } catch (e) {}
  }
  return null;
}

(async () => {
  let token = findToken() || process.env.NETLIFY_AUTH_TOKEN;
  if (!token) {
    // Try requiring netlify-cli's config
    try {
      const getGlobalConfig = require('netlify-cli/lib/utils/get-global-config');
      const conf = await getGlobalConfig();
      token = conf.get('auth token') || conf.get('users')[0].auth.token;
    } catch (e) {}
  }
  if (!token) { console.error('NO TOKEN FOUND'); process.exit(1); }

  const api = new NetlifyAPI(token);
  try {
    const site = await api.createSite({ body: { name: 'rk-creators-builders' } });
    console.log('SITE CREATED:', site.id, site.url, site.name);
    fs.writeFileSync('.netlify-state.json', JSON.stringify({ id: site.id }));
  } catch (e) {
    console.error('createSite error:', e.message);
    try {
      // Maybe already exists - try to get by name
      const list = await api.listSites({ filter: 'rk-creators-builders' });
      console.log('Existing sites:', JSON.stringify(list.map(s => ({ id: s.id, url: s.url }))));
    } catch (e2) { console.error('list error', e2.message); }
  }
})();
