/**
 * Edge Health Endpoint Tests
 * 
 * Tests for edge-optimized health endpoint.
 */

// Note: Edge functions run in a different runtime, so we test the logic
// rather than the actual edge function execution

describe('Edge Health Endpoint', () => {
  it('should have edge runtime configuration', () => {
    // This test verifies the file structure
    const fs = require('fs');
    const path = require('path');
    
    const edgeHealthFile = path.join(process.cwd(), 'pages/api/health-edge.ts');
    const fileContent = fs.readFileSync(edgeHealthFile, 'utf8');
    
    expect(fileContent).toContain('runtime: \'edge\'');
    expect(fileContent).toContain('export const config');
  });

  it('should include server timestamp header', () => {
    const fs = require('fs');
    const path = require('path');
    
    const edgeHealthFile = path.join(process.cwd(), 'pages/api/health-edge.ts');
    const fileContent = fs.readFileSync(edgeHealthFile, 'utf8');
    
    expect(fileContent).toContain('X-Server-Time');
  });

  it('should include edge region information', () => {
    const fs = require('fs');
    const path = require('path');
    
    const edgeHealthFile = path.join(process.cwd(), 'pages/api/health-edge.ts');
    const fileContent = fs.readFileSync(edgeHealthFile, 'utf8');
    
    expect(fileContent).toContain('req.geo');
    expect(fileContent).toContain('region');
  });
});
