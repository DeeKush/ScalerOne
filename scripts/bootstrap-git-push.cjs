/**
 * Bootstrap git via isomorphic-git (system git blocked by Xcode license).
 * Creates initial commit and pushes to remotes.
 */
const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const { execSync } = require('child_process');

const dir = '/Users/ariyan/Projects/ScalerOne';
const author = { name: 'Hollenite', email: 'hollenite@users.noreply.github.com' };

function getToken() {
  return execSync('gh auth token', { encoding: 'utf8' }).trim();
}

function shouldIgnore(rel) {
  const parts = rel.split(path.sep);
  const ignoreDirs = new Set([
    'node_modules',
    '.git',
    '.expo',
    'android',
    'ios',
    '.idea',
    '.cursor',
    '.claude',
    'dist',
    'web-build',
  ]);
  if (parts.some((p) => ignoreDirs.has(p))) return true;
  const base = parts[parts.length - 1];
  if (base === '.env' || base.startsWith('.env.') && base !== '.env.example') return true;
  if (base === 'expo-env.d.ts') return true;
  if (base.endsWith('.tsbuildinfo')) return true;
  if (base === '.DS_Store') return true;
  if (rel.includes('local.properties')) return true;
  // ignore palette ppm binary noise
  if (base.endsWith('.ppm')) return true;
  return false;
}

function walk(abs, relBase = '') {
  const out = [];
  for (const name of fs.readdirSync(abs)) {
    const rel = relBase ? `${relBase}/${name}` : name;
    if (shouldIgnore(rel)) continue;
    const full = path.join(abs, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walk(full, rel));
    else out.push(rel);
  }
  return out;
}

async function main() {
  const token = getToken();
  const onAuth = () => ({ username: 'Hollenite', password: token });

  if (!fs.existsSync(path.join(dir, '.git'))) {
    await git.init({ fs, dir, defaultBranch: 'main' });
    console.log('Initialized git repo on main');
  }

  const files = walk(dir);
  console.log(`Staging ${files.length} files`);
  for (const filepath of files) {
    await git.add({ fs, dir, filepath });
  }

  const status = await git.statusMatrix({ fs, dir });
  const changes = status.filter(([, head, workdir, stage]) => !(head === 1 && workdir === 1 && stage === 1));
  console.log(`Matrix changes: ${changes.length}`);

  const sha = await git.commit({
    fs,
    dir,
    message:
      'feat: initial Scaler Hub motion MVP prototype\n\n' +
      'Ship Expo SDK 54 app with Info→Auth(25/75)→Hub flow, Firebase/mock auth,\n' +
      'hierarchical floating nav with pill highlight, Academic Blue tokens, and\n' +
      'Android native project support for device testing.',
    author,
  });
  console.log('Committed', sha);

  // remotes
  const remotes = await git.listRemotes({ fs, dir });
  const ensureRemote = async (name, url) => {
    if (remotes.find((r) => r.remote === name)) {
      await git.deleteRemote({ fs, dir, remote: name });
    }
    await git.addRemote({ fs, dir, remote: name, url });
  };
  await ensureRemote('origin', 'https://github.com/Hollenite/ScalerOne.git');
  await ensureRemote('deekush', 'https://github.com/DeeKush/ScalerOne.git');

  console.log('Pushing to origin (Hollenite/ScalerOne)...');
  await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    onAuth,
    force: false,
  });
  console.log('Pushed to Hollenite/ScalerOne');

  // Seed DeeKush if empty: push main there too as base, then we'll PR from a sync branch.
  // For empty repos, push creates main.
  console.log('Pushing main to deekush (DeeKush/ScalerOne) to establish base branch...');
  try {
    await git.push({
      fs,
      http,
      dir,
      remote: 'deekush',
      ref: 'main',
      onAuth,
      force: false,
    });
    console.log('Pushed main to DeeKush/ScalerOne');
  } catch (e) {
    console.log('DeeKush push result:', e.message || e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
