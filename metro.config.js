// Metro config: teach the bundler about expo-sqlite's WASM asset so the web
// target can bundle offline-first SQLite (wa-sqlite) correctly.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// WASM must be an asset (not parsed as JS) for the web worker to fetch it.
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// expo-sqlite ships web worker code that Metro should treat as source.
config.resolver.sourceExts = Array.from(new Set([...config.resolver.sourceExts, 'mjs']));

// Cross-origin isolation headers are required for OPFS-backed SQLite on web.
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  return middleware(req, res, next);
};

module.exports = config;
