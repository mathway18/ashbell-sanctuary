const fs = require('fs');
const path = require('path');

fs.mkdirSync('docs', { recursive: true });

for (const file of [
  'index.html',
  'Ashbell-Sanctuary.glb',
  'overview.png',
  'THREE-LICENSE.txt',
  'CSG-LICENSE.txt',
  'MESH-BVH-LICENSE.txt',
]) {
  if (!fs.existsSync(file)) throw new Error('Missing release artifact: ' + file);
  fs.copyFileSync(file, path.join('docs', file));
}

const dashboard = 'math-test-archive/index.html';
if (!fs.existsSync(dashboard)) throw new Error('Missing dashboard: ' + dashboard);
const dashboardOutput = path.join('docs', dashboard);
fs.mkdirSync(path.dirname(dashboardOutput), { recursive: true });
fs.copyFileSync(dashboard, dashboardOutput);

fs.writeFileSync('docs/.nojekyll', '');
console.log('Prepared GitHub Pages static directory.');
