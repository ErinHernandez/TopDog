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

// Ensure directories exist
const requiredDirs = [
  devServerDir,
  path.join(devServerDir, 'pages'),
  path.join(projectRoot, '.next', 'dev', 'static', 'webpack')
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

// Create a placeholder hot-update.json to prevent ENOENT errors
const hotUpdateDir = path.join(projectRoot, '.next', 'dev', 'static', 'webpack');
if (!fs.existsSync(hotUpdateDir)) {
  fs.mkdirSync(hotUpdateDir, { recursive: true });
}
// Create a .gitkeep to ensure directory persists
fs.writeFileSync(path.join(hotUpdateDir, '.gitkeep'), '');

console.log('✅ All manifest files ensured');
