const fs = require('fs');
let code = fs.readFileSync('server/storage.ts', 'utf8');

code = code.replace(/const existing = db\.select\(\)\.from\(payroll\)/, 'const existing = await db.select().from(payroll)');
code = code.replace(/const siteWorkers = db\.select\(\)\.from\(workers\)/, 'const siteWorkers = await db.select().from(workers)');

fs.writeFileSync('server/storage.ts', code);
console.log('Fixed await for existing and siteWorkers');
