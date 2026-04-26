const fs = require('fs');
let code = fs.readFileSync('server/storage.ts', 'utf8');

// Fix getDashboardStats
code = code.replace(/db\.select\(\{ count: sql<number>`count\(\*\)` \}\)\s*\.from\(sites\)\.where\(eq\(sites\.status, "active"\)\)\.then\(res => res\[0\]\)\?\.count/g, '(await db.select({ count: sql<number>`count(*)` }).from(sites).where(eq(sites.status, "active")))[0]?.count');

code = code.replace(/db\.select\(\{ count: sql<number>`count\(\*\)` \}\)\s*\.from\(workers\)\.where\(eq\(workers\.status, "active"\)\)\.then\(res => res\[0\]\)\?\.count/g, '(await db.select({ count: sql<number>`count(*)` }).from(workers).where(eq(workers.status, "active")))[0]?.count');

code = code.replace(/db\.select\(\{ total: sql<number>`coalesce\(sum\(net_salary\), 0\)` \}\)\s*\.from\(payroll\)\s*\.where\(eq\(payroll\.month, currentMonth\)\)\s*\.then\(res => res\[0\]\)\?\.total/g, '(await db.select({ total: sql<number>`coalesce(sum(net_salary), 0)` }).from(payroll).where(eq(payroll.month, currentMonth)))[0]?.total');

code = code.replace(/db\.select\(\{ count: sql<number>`count\(\*\)` \}\)\s*\.from\(attendance\)\s*\.where\(and\(eq\(attendance\.siteId, siteId\), eq\(attendance\.date, today\), eq\(attendance\.status, "present"\)\)\)\s*\.then\(res => res\[0\]\)\?\.count/g, '(await db.select({ count: sql<number>`count(*)` }).from(attendance).where(and(eq(attendance.siteId, siteId), eq(attendance.date, today), eq(attendance.status, "present"))))[0]?.count');

code = code.replace(/db\.select\(\{ count: sql<number>`count\(\*\)` \}\)\s*\.from\(attendance\)\s*\.where\(and\(eq\(attendance\.date, today\), eq\(attendance\.status, "present"\)\)\)\s*\.then\(res => res\[0\]\)\?\.count/g, '(await db.select({ count: sql<number>`count(*)` }).from(attendance).where(and(eq(attendance.date, today), eq(attendance.status, "present"))))[0]?.count');

code = code.replace(/db\.select\(\{ total: sql<number>`coalesce\(sum\(\$\{expenses\.amount\}\), 0\)` \}\)\s*\.from\(expenses\)\s*\.where\(and\(eq\(expenses\.siteId, siteId\), eq\(expenses\.expenseDate, today\)\)\)\s*\.then\(res => res\[0\]\)\?\.total/g, '(await db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(and(eq(expenses.siteId, siteId), eq(expenses.expenseDate, today))))[0]?.total');

code = code.replace(/db\.select\(\{ total: sql<number>`coalesce\(sum\(\$\{expenses\.amount\}\), 0\)` \}\)\s*\.from\(expenses\)\s*\.where\(eq\(expenses\.expenseDate, today\)\)\s*\.then\(res => res\[0\]\)\?\.total/g, '(await db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(eq(expenses.expenseDate, today)))[0]?.total');

code = code.replace(/db\.select\(\{ count: sql<number>`count\(\*\)` \}\)\s*\.from\(dpr\)\s*\.where\(and\(eq\(dpr\.siteId, siteId\), eq\(dpr\.date, today\)\)\)\s*\.then\(res => res\[0\]\)\?\.count/g, '(await db.select({ count: sql<number>`count(*)` }).from(dpr).where(and(eq(dpr.siteId, siteId), eq(dpr.date, today))))[0]?.count');

code = code.replace(/db\.select\(\{ siteId: dpr\.siteId \}\)\s*\.from\(dpr\)\.where\(eq\(dpr\.date, today\)\)/g, 'await db.select({ siteId: dpr.siteId }).from(dpr).where(eq(dpr.date, today))');

code = code.replace(/db\.select\(\{ id: sites\.id \}\)\s*\.from\(sites\)\.where\(eq\(sites\.status, "active"\)\)/g, 'await db.select({ id: sites.id }).from(sites).where(eq(sites.status, "active"))');

// Fix generatePayroll
code = code.replace(/const attRowsByName = db\.select\(\)\.from\(attendance\)/g, 'const attRowsByName = await db.select().from(attendance)');
code = code.replace(/const advanceRows = db\.select\(\)\.from\(advances\)\s*\.where\(and\(\s*eq\(advances\.workerId, worker\.id\),\s*sql`substr\(\$\{advances\.date\}, 1, 7\) = \$\{month\}`\s*\)\)\s*;/g, 'const advanceRows = await db.select().from(advances).where(and(eq(advances.workerId, worker.id), sql`substr(${advances.date}, 1, 7) = ${month}`));');

fs.writeFileSync('server/storage.ts', code);
console.log('Fixed await errors');
