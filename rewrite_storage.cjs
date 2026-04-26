const fs = require('fs');
let code = fs.readFileSync('server/storage.ts', 'utf8');

// Replace imports
code = code.replace(/import \{ drizzle \} from "drizzle-orm\/better-sqlite3";/, 'import { drizzle } from "drizzle-orm/libsql";\nimport { createClient } from "@libsql/client";');
code = code.replace(/import Database from "better-sqlite3";/, '');

// Replace DB initialization
code = code.replace(/const sqlite = new Database\(process\.env\.DATABASE_URL \|\| "data\.db"\);\nsqlite\.pragma\("journal_mode = WAL"\);/, `const client = createClient({
  url: process.env.DATABASE_URL || "file:data.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});`);

// Replace sqlite.exec with client.executeMultiple
code = code.replace(/sqlite\.exec\(`/g, 'await client.executeMultiple(`');

// Add top level async wrapper for the table creation
code = code.replace(/\/\/ ─── Auto-migration: create new tables if they don't exist ───────────────────\n(await client\.executeMultiple\(`[\s\S]*?`\);)\n\ntry \{\n  await client\.executeMultiple\(`ALTER TABLE attendance ADD COLUMN worker_id INTEGER`\);\n\} catch \{\n  \/\/ Column already exists — ignore\n\}/g, `// ─── Auto-migration: create new tables if they don't exist ───────────────────
async function migrate() {
$1
  try {
    await client.executeMultiple(\`ALTER TABLE attendance ADD COLUMN worker_id INTEGER\`);
  } catch {
    // Column already exists — ignore
  }
}
migrate();`);

// Replace db export
code = code.replace(/export const db = drizzle\(sqlite\);/, 'export const db = drizzle(client);');

// Replace .all() -> nothing (since db.select() returns array)
code = code.replace(/\.all\(\)/g, '');

// Replace .get() -> [0]
// example: return db.select().from(users).where(...).get(); 
// becomes: const [res] = await db.select().from(users).where(...); return res;
// Wait, regex for this is tricky. Instead, just append `then(r => r[0])`!
// db.select().from(users).where(...).get() -> await db.select().from(users).where(...).then(res => res[0])
code = code.replace(/\.get\(\)/g, '.then(res => res[0])');

fs.writeFileSync('server/storage.ts', code);
console.log('Rewritten server/storage.ts');
