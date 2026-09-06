const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable wasm for expo-sqlite on web
config.resolver.assetExts.push('wasm');

// expo-sqlite's web backend (wa-sqlite) calls SharedArrayBuffer, which browsers
// only expose to cross-origin-isolated pages. Without these headers the web dev
// build fails with "SharedArrayBuffer is not defined" on the first query.
// Native (Android/iOS) is unaffected — it uses the real native SQLite module.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  return middleware(req, res, next);
};

module.exports = config;
