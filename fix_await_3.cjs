const fs = require('fs');
let code = fs.readFileSync('server/storage.ts', 'utf8');

// Fix getAttendanceSummary and getAttendanceByWorkerMonth awaits
code = code.replace(/const rows = db\.select\(\)\.from\(attendance\)/g, 'const rows = await db.select().from(attendance)');

// Wrap raw sql execution in a function
const searchStr = `// ─── Auto-migration: create new tables if they don't exist ───────────────────
await client.executeMultiple(\``;

if (code.includes(searchStr)) {
  const replacement = `// ─── Auto-migration: create new tables if they don't exist ───────────────────
async function migrate() {
  await client.executeMultiple(\``;
  code = code.replace(searchStr, replacement);
  
  // Now find the end of the migrate block which is the catch block
  const endStr = `} catch {
  // Column already exists — ignore
}`;
  if (code.includes(endStr)) {
    code = code.replace(endStr, `} catch {
    // Column already exists — ignore
  }
}
migrate().catch(console.error);`);
  }
}

fs.writeFileSync('server/storage.ts', code);
console.log('Fixed final TS errors');
