const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
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

function readDotEnv() {
  const file = path.join(root, '.env');
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

process.env.CI = '1';

const googleServices = path.join(root, 'google-services.json');
if (!fs.existsSync(googleServices)) {
  fail(
    'google-services.json is missing at the project root.\n' +
      'Download it from Firebase Console (Android app com.scaler.hub) and place it next to app.json before npm run apk.'
  );
}

function assertGoogleServices() {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(googleServices, 'utf8'));
  } catch {
    fail('google-services.json is not valid JSON.');
  }
  const projectId = parsed?.project_info?.project_id;
  const oauth = parsed?.client?.[0]?.oauth_client;
  if (!Array.isArray(oauth) || oauth.length === 0) {
    fail(
      'google-services.json oauth_client is empty. Download a fresh file from Firebase Console for com.scaler.hub.'
    );
  }
  const web = oauth.find((client) => client.client_type === 3);
  const androidClient = oauth.find((client) => client.client_type === 1);
  console.log(`Firebase project: ${projectId || '(missing)'}`);
  if (projectId && projectId !== 'scalerone-746d8') {
    console.warn(`Expected project_id scalerone-746d8, found ${projectId}.`);
  }
  if (web?.client_id) {
    console.log(`Web OAuth client (type 3): ${web.client_id}`);
    const envId = readDotEnv().EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (envId && envId !== web.client_id) {
      console.warn(
        `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env does not match google-services.json type 3.\n` +
          `  .env:  ${envId}\n` +
          `  json:  ${web.client_id}`
      );
    }
  } else {
    console.warn('No type 3 (Web) OAuth client in google-services.json.');
  }
  if (androidClient?.android_info?.certificate_hash) {
    console.log(`Android OAuth SHA-1 in google-services.json: ${androidClient.android_info.certificate_hash}`);
  }
}

function printKeystoreFingerprints(keystore, alias, storepass, label) {
  if (!fs.existsSync(keystore)) return false;
  const result = spawnSync(
    'keytool',
    ['-list', '-v', '-keystore', keystore, '-alias', alias, '-storepass', storepass],
    { encoding: 'utf8' }
  );
  const text = `${result.stdout || ''}${result.stderr || ''}`;
  const sha1 = text.match(/SHA1:\s*([0-9A-F:]+)/i);
  const sha256 = text.match(/SHA-256:\s*([0-9A-F:]+)/i);
  if (!sha1 && !sha256) return false;
  console.log(`Signing cert (${label}):`);
  if (sha1) console.log(`  SHA-1:   ${sha1[1]}`);
  if (sha256) console.log(`  SHA-256: ${sha256[1]}`);
  console.log('Add these fingerprints to the Firebase Android app (Authentication / Project settings).\n');
  return true;
}

function printApkCert(apkPath) {
  const unzip = spawnSync('unzip', ['-Z', '-1', apkPath], { encoding: 'utf8' });
  const entry = `${unzip.stdout || ''}`
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /^META-INF\/.+\.(RSA|DSA|EC)$/i.test(line));
  if (!entry) {
    console.warn('Could not find a signing cert inside the APK.');
    return;
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scalerone-apk-'));
  const extract = spawnSync('unzip', ['-o', '-q', apkPath, entry, '-d', tmp], { encoding: 'utf8' });
  if (extract.status !== 0) {
    console.warn('Could not extract the APK signing cert.');
    return;
  }
  const certFile = path.join(tmp, entry);
  const result = spawnSync('keytool', ['-printcert', '-file', certFile], { encoding: 'utf8' });
  const text = `${result.stdout || ''}${result.stderr || ''}`;
  const sha1 = text.match(/SHA1:\s*([0-9A-F:]+)/i);
  const sha256 = text.match(/SHA-256:\s*([0-9A-F:]+)/i);
  if (!sha1 && !sha256) return;
  console.log('APK signing cert (this file):');
  if (sha1) console.log(`  SHA-1:   ${sha1[1]}`);
  if (sha256) console.log(`  SHA-256: ${sha256[1]}`);
  console.log('');
}

function fileFingerprint(file) {
  if (!fs.existsSync(file)) return `${path.relative(root, file)}:missing`;
  const st = fs.statSync(file);
  return `${path.relative(root, file)}:${st.size}:${Math.round(st.mtimeMs)}`;
}

const NATIVE_INPUTS = [
  'app.json',
  'package.json',
  'google-services.json',
  'assets/images/icon.png',
  'assets/images/splash-icon.png',
  'assets/images/android-icon-foreground.png',
  'assets/images/android-icon-background.png',
  'assets/images/android-icon-monochrome.png',
].map((file) => path.join(root, file));

function nativeStamp() {
  return crypto.createHash('sha1').update(NATIVE_INPUTS.map(fileFingerprint).join('\n')).digest('hex');
}

function patchGradleMemory() {
  const file = path.join(root, 'android', 'gradle.properties');
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, 'utf8');
  const jvm = 'org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError';
  if (/^org\.gradle\.jvmargs=/m.test(text)) {
    text = text.replace(/^org\.gradle\.jvmargs=.*$/m, jvm);
  } else {
    text += `\n${jvm}\n`;
  }
  fs.writeFileSync(file, text);
}

assertGoogleServices();

const wantClean = process.argv.includes('--clean');
const gradlew = path.join(root, 'android', 'gradlew');
const stampFile = path.join(root, 'android', '.scalerone-prebuild-stamp');
const stamp = nativeStamp();
const prev = fs.existsSync(stampFile) ? fs.readFileSync(stampFile, 'utf8').trim() : '';
const needPrebuild = wantClean || !fs.existsSync(gradlew) || prev !== stamp;

if (needPrebuild) {
  console.log(
    wantClean
      ? '1/3  expo prebuild --clean (android)'
      : '1/3  expo prebuild (android — native inputs changed or missing)'
  );
  const args = ['expo', 'prebuild', '-p', 'android'];
  if (wantClean) args.push('--clean');
  run('npx', args, root);
  fs.writeFileSync(stampFile, `${stamp}\n`);
} else {
  console.log('1/3  skipping expo prebuild (android/ present, native inputs unchanged). Pass --clean to force.');
}

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

patchGradleMemory();

const debugKeystore = path.join(root, 'android', 'app', 'debug.keystore');
printKeystoreFingerprints(
  debugKeystore,
  'androiddebugkey',
  'android',
  'android/app/debug.keystore — signs assembleRelease in this project'
);

console.log('2/3  assembleRelease arm64-v8a (JS bundled into APK — no Metro, no USB)');
run(
  gradlew,
  [':app:assembleRelease', '-PreactNativeArchitectures=arm64-v8a'],
  path.join(root, 'android')
);

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
const dest = path.join(dist, 'ScalerOne-preview.apk');
fs.copyFileSync(apkSrc, dest);
printApkCert(dest);

console.log(`3/3  copied ${dest}`);
console.log(`
Standalone APK is ready.

Install on a phone (no USB, no Metro):
  1. Send dist/ScalerOne-preview.apk via Drive, WhatsApp, or AirDrop.
  2. On the phone, open the file.
  3. Allow install from this source if Android asks.
  4. Open ScalerOne.

Daily login testing does not need this APK. USB once:
  npx expo run:android
  npm start
Then iterate JS against the installed dev client. Rebuild the APK only to sideload without Metro,
or after native/plugin/icon/google-services changes.

If Google sign-in works but Firestore says unavailable, create the default database in
Firebase Console → scalerone-746d8 → Firestore (database ID must be "(default)").
`);
