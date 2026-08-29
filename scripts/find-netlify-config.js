// Helper: create the Netlify site reliably via the API using the CLI's auth.
const fs = require('fs');
const os = require('os');
const path = require('path');

function findNetlifyConfig() {
  const probes = [
    path.join(os.homedir(), '.config', 'netlify', 'config.json'),
    path.join(os.homedir(), '.netlify', 'config.json'),
    path.join(process.env.APPDATA || '', 'netlify', 'config.json'),
    path.join(os.homedir(), '.config', 'configstore', 'netlify.json'),
    path.join(os.homedir(), '.config', 'configstore', 'netlify-cli.json'),
  ];
  for (const f of probes) {
    try { if (fs.existsSync(f)) return f; } catch (e) {}
  }
  return null;
}

const cfgFile = findNetlifyConfig();
console.log('Config file:', cfgFile);
