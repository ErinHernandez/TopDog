/**
 * Next.js Webpack Plugin to ensure manifest files exist
 * This runs during webpack compilation to create manifests if missing
 */

const fs = require('fs');
const path = require('path');

class NextManifestPlugin {
  apply(compiler) {
    compiler.hooks.beforeCompile.tap('NextManifestPlugin', () => {
      const projectRoot = compiler.context || process.cwd();
      const devServerDir = path.join(projectRoot, '.next', 'dev', 'server');
      const devDir = path.join(projectRoot, '.next', 'dev');

      // Ensure directories exist
      [devServerDir, path.join(devServerDir, 'pages')].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });

      // Create middleware-manifest.json
      const middlewareManifest = {
        version: 3,
        middleware: {},
        functions: {},
        sortedMiddleware: []
      };
      const middlewarePath = path.join(devServerDir, 'middleware-manifest.json');
      if (!fs.existsSync(middlewarePath)) {
        fs.writeFileSync(middlewarePath, JSON.stringify(middlewareManifest, null, 2));
      }

      // Create pages-manifest.json
      const pagesManifest = {
        "/_app": "pages/_app.js",
        "/_error": "pages/_error.js",
        "/_document": "pages/_document.js"
      };
      const pagesPath = path.join(devServerDir, 'pages-manifest.json');
      if (!fs.existsSync(pagesPath)) {
        fs.writeFileSync(pagesPath, JSON.stringify(pagesManifest, null, 2));
      }

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
      const routesPath = path.join(devDir, 'routes-manifest.json');
      if (!fs.existsSync(routesPath)) {
        fs.writeFileSync(routesPath, JSON.stringify(routesManifest));
      }
    });
  }
}

module.exports = NextManifestPlugin;
