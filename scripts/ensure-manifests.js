#!/usr/bin/env node

/**
 * Ensure Next.js manifest files exist before dev server starts
 * This works around a Next.js 16.1.3 webpack initialization bug
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const devServerDir = path.join(projectRoot, '.next', 'dev', 'server');
const devDir = path.join(projectRoot, '.next', 'dev');

try {
  // Ensure directories exist (including webpack cache dirs to avoid ENOENT on first compile)
const requiredDirs = [
  devServerDir,
  path.join(devServerDir, 'pages'),
  path.join(projectRoot, '.next', 'dev', 'static', 'webpack'),
  path.join(projectRoot, '.next', 'dev', 'cache', 'webpack', 'client-development'),
  path.join(projectRoot, '.next', 'dev', 'cache', 'webpack', 'client-development-fallback'),
  path.join(projectRoot, '.next', 'dev', 'cache', 'webpack', 'server-development'),
];

requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Create middleware-manifest.json
// Use the format that Next.js expects (with proper structure)
const middlewareManifest = {
  version: 3,
  middleware: {},
  functions: {},
  sortedMiddleware: []
};

const middlewareManifestPath = path.join(devServerDir, 'middleware-manifest.json');
// Always write (force create) to ensure file exists even if Next.js deletes it
fs.writeFileSync(middlewareManifestPath, JSON.stringify(middlewareManifest, null, 2));
console.log('✅ Created/updated middleware-manifest.json');

// Create pages-manifest.json
const pagesManifest = {
  "/_app": "pages/_app.js",
  "/_error": "pages/_error.js",
  "/_document": "pages/_document.js"
};

const pagesManifestPath = path.join(devServerDir, 'pages-manifest.json');
// Always write (force create) to ensure file exists even if Next.js deletes it
fs.writeFileSync(pagesManifestPath, JSON.stringify(pagesManifest, null, 2));
console.log('✅ Created/updated pages-manifest.json');

// Create routes-manifest.json
const routesManifest = {
  version: 3,
  pages404: true,
  basePath: "",
  redirects: [],
  rewrites: [],
  headers: [],
  dynamicRoutes: [],
  dataRoutes: [],
  i18n: null
};

const routesManifestPath = path.join(devDir, 'routes-manifest.json');
// Always write (force create) to ensure file exists even if Next.js deletes it
// Also create in server directory if it exists (for compatibility)
fs.writeFileSync(routesManifestPath, JSON.stringify(routesManifest));
const serverRoutesManifestPath = path.join(devServerDir, 'routes-manifest.json');
if (fs.existsSync(devServerDir)) {
  fs.writeFileSync(serverRoutesManifestPath, JSON.stringify(routesManifest));
}
console.log('✅ Created/updated routes-manifest.json');

// Create a .gitkeep in webpack static dir to ensure it persists
const hotUpdateDir = path.join(projectRoot, '.next', 'dev', 'static', 'webpack');
fs.writeFileSync(path.join(hotUpdateDir, '.gitkeep'), '');

// Always write fallback-build-manifest.json (Next may delete it; we re-create before dev starts)
const fallbackManifest = { polyfillFiles: [], devFiles: [], ampDevFiles: [], lowPriorityFiles: [] };
const fallbackManifestPath = path.join(devDir, 'fallback-build-manifest.json');
fs.writeFileSync(fallbackManifestPath, JSON.stringify(fallbackManifest, null, 2));
console.log('✅ Created/updated fallback-build-manifest.json');

// Always write prerender-manifest.json (Next expects it before first compile; we bootstrap it)
const prerenderManifest = {
  version: 4,
  routes: {},
  dynamicRoutes: {},
  notFoundRoutes: [],
  preview: {
    previewModeId: '00000000000000000000000000000000',
    previewModeSigningKey: '0000000000000000000000000000000000000000000000000000000000000000',
    previewModeEncryptionKey: '0000000000000000000000000000000000000000000000000000000000000000',
  },
};
const prerenderManifestPath = path.join(devDir, 'prerender-manifest.json');
fs.writeFileSync(prerenderManifestPath, JSON.stringify(prerenderManifest, null, 2));
console.log('✅ Created/updated prerender-manifest.json');

console.log('✅ All manifest files ensured');
} catch (err) {
  console.error('❌ ensure-manifests failed:', err.message);
  process.exit(1);
}
