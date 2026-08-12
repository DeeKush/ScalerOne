const fs = require('fs');
const path = require('path');
const os = require('os');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const { execSync } = require('child_process');

const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
const onAuth = () => ({ username: 'Hollenite', password: token });
const author = { name: 'Hollenite', email: 'hollenite@users.noreply.github.com' };

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deekush-seed-'));
  await git.init({ fs, dir, defaultBranch: 'main' });
  fs.writeFileSync(
    path.join(dir, 'README.md'),
    '# ScalerOne\n\nRepository seeded for incoming prototype PR from Hollenite/ScalerOne.\n'
  );
  await git.add({ fs, dir, filepath: 'README.md' });
  await git.commit({
    fs,
    dir,
    message: 'chore: seed empty ScalerOne base for prototype PR',
    author,
  });
  await git.addRemote({
    fs,
    dir,
    remote: 'origin',
    url: 'https://github.com/DeeKush/ScalerOne.git',
  });
  await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    force: true,
    onAuth,
  });
  console.log('Force-seeded DeeKush/ScalerOne main with stub README');
  console.log('Temp dir:', dir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
