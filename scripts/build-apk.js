const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const androidHome =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  path.join(process.env.HOME || '', 'Library/Android/sdk');

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

if (!fs.existsSync(androidHome)) {
  fail(
    `ANDROID_HOME not found at ${androidHome}.\n` +
      'Set ANDROID_HOME to your Android SDK (Android Studio default: ~/Library/Android/sdk).'
  );
}

process.env.ANDROID_HOME = androidHome;
process.env.ANDROID_SDK_ROOT = androidHome;

if (!process.env.JAVA_HOME) {
  const jdkCandidates = [
    path.join(process.env.HOME || '', 'Library/Java/JavaVirtualMachines/jbr-21.0.11/Contents/Home'),
    '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
  ];
  const jdk = jdkCandidates.find((dir) => {
    const java = path.join(dir, 'bin', 'java');
    if (!fs.existsSync(java)) return false;
    const probe = spawnSync(java, ['-version'], { encoding: 'utf8' });
    const text = `${probe.stderr || ''}${probe.stdout || ''}`;
    const major = Number((text.match(/version "(\d+)/) || [])[1] || 0);
    return major >= 17 && major <= 24;
  });
  if (jdk) process.env.JAVA_HOME = jdk;
}

if (!process.env.JAVA_HOME) {
  fail(
    'JAVA_HOME is not set. Install Android Studio (its bundled JBR works) or a JDK 17+ and export JAVA_HOME.'
  );
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

process.env.CI = '1';

console.log('1/3  expo prebuild (android)');
run('npx', ['expo', 'prebuild', '-p', 'android'], root);

const gradlew = path.join(root, 'android', 'gradlew');
if (!fs.existsSync(gradlew)) {
  fail('android/gradlew missing after prebuild.');
}
fs.chmodSync(gradlew, 0o755);

const wrapperProps = path.join(root, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');
if (fs.existsSync(wrapperProps)) {
  const next = fs
    .readFileSync(wrapperProps, 'utf8')
    .replace(/networkTimeout=\d+/, 'networkTimeout=120000');
  fs.writeFileSync(wrapperProps, next);
}

console.log('2/3  assembleRelease (JS bundled into APK — no Metro, no USB)');
run(gradlew, [':app:assembleRelease'], path.join(root, 'android'));

const candidates = [
  path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
];
const apkSrc = candidates.find((file) => fs.existsSync(file));
if (!apkSrc) {
  fail('Release APK not found under android/app/build/outputs/apk/release/.');
}

const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });
const dest = path.join(dist, 'ScalerHub-preview.apk');
fs.copyFileSync(apkSrc, dest);

console.log(`3/3  copied ${dest}`);
console.log(`
Standalone APK is ready.

Install on a phone (no USB, no Metro):
  1. Send dist/ScalerHub-preview.apk via Drive, WhatsApp, or AirDrop.
  2. On the phone, open the file.
  3. Allow install from this source if Android asks.
  4. Open Scaler Hub.

USB + \`npx expo run:android\` is only for live debug. That debug build dies when Metro/USB goes away.
`);
