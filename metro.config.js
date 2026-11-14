// Metro bundler configuration.
// We start from Expo's default settings and add two things that expo-sqlite
// needs to run in a WEB browser (Android/iOS are not affected):
//
// 1. On web, SQLite runs as WebAssembly, loaded from a ".wasm" file, so Metro
//    must be allowed to serve .wasm files.
// 2. SQLite on web uses SharedArrayBuffer, which browsers only enable when the
//    page is sent with these two security headers (COEP and COOP).
//
// Source: Expo SDK 57 docs, expo-sqlite "Web setup".

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1. Add wasm asset support
config.resolver.assetExts.push('wasm');

// 2. Add COEP and COOP headers to support SharedArrayBuffer
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
