import {
  type User, type InsertUser, users,
  type Site, type InsertSite, sites,
  type Attendance, type InsertAttendance, attendance,
  type Dpr, type InsertDpr, dpr,
  type Expense, type InsertExpense, expenses,
  type Worker, type InsertWorker, workers,
  type Contractor, type InsertContractor, contractors,
  type Payroll, type InsertPayroll, payroll,
  type Advance, type InsertAdvance, advances,
  type Subscription, type InsertSubscription, subscriptions,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

import { eq, and, between, sql, desc, gte, lte } from "drizzle-orm";

const client = createClient({
  url: process.env.DATABASE_URL || "file:data.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// ─── Auto-migration: create new tables if they don't exist ───────────────────
async function migrate() {
  await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan_code TEXT NOT NULL DEFAULT 'free_trial',
    billing_interval TEXT NOT NULL DEFAULT 'monthly',
    gateway TEXT,
    gateway_subscription_id TEXT,
    gateway_customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'trialing',
    current_period_start TEXT,
    current_period_end TEXT,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contractors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    gst_number TEXT,
    payment_terms TEXT DEFAULT 'monthly',
    bank_account TEXT,
    ifsc_code TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    trade TEXT,
    contractor_id INTEGER,
    site_id INTEGER,
    wage_type TEXT NOT NULL DEFAULT 'daily',
    daily_wage REAL NOT NULL DEFAULT 0,
    monthly_salary REAL,
    overtime_rate REAL DEFAULT 0,
    joining_date TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    site_id INTEGER NOT NULL,
    month TEXT NOT NULL,
    present_days REAL NOT NULL DEFAULT 0,
    half_days REAL NOT NULL DEFAULT 0,
    absent_days REAL NOT NULL DEFAULT 0,
    overtime_hours REAL NOT NULL DEFAULT 0,
    advance REAL NOT NULL DEFAULT 0,
    deduction REAL NOT NULL DEFAULT 0,
    gross_salary REAL NOT NULL DEFAULT 0,
    net_salary REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS advances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL
  );
`);

// Add worker_id column to attendance if it doesn't exist (safe migration)
try {
  await client.executeMultiple(`ALTER TABLE attendance ADD COLUMN worker_id INTEGER`);
} catch {
    // Column already exists — ignore
  }

// Add user_id to sites for data isolation
try {
  await client.executeMultiple(`ALTER TABLE sites ADD COLUMN user_id INTEGER`);
} catch {
  // Column already exists — ignore
}

// Add user_id to contractors for data isolation
try {
  await client.executeMultiple(`ALTER TABLE contractors ADD COLUMN user_id INTEGER`);
} catch {
  // Column already exists — ignore
}

// Add company_id to users for multi-tenancy
try {
  await client.executeMultiple(`ALTER TABLE users ADD COLUMN company_id INTEGER`);
} catch {
  // Column already exists — ignore
}
// Backfill: every existing user becomes their own company (admin of themselves)
try {
  await client.executeMultiple(`UPDATE users SET company_id = id WHERE company_id IS NULL`);
} catch {
  // ignore
}
}
migrate().catch(console.error);

export const db = drizzle(client);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(companyId?: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;

  // Sites
  getSites(userId: number): Promise<Site[]>;
  getSite(id: number): Promise<Site | undefined>;
  createSite(site: InsertSite): Promise<Site>;
  updateSite(id: number, data: Partial<InsertSite>): Promise<Site | undefined>;
  deleteSite(id: number): Promise<void>;

  // Contractors
  getContractors(userId: number, status?: string): Promise<Contractor[]>;
  getContractor(id: number): Promise<Contractor | undefined>;
  createContractor(c: InsertContractor): Promise<Contractor>;
  updateContractor(id: number, data: Partial<InsertContractor>): Promise<Contractor | undefined>;

  // Workers
  getWorkers(siteId?: number, status?: string): Promise<Worker[]>;
  getWorker(id: number): Promise<Worker | undefined>;
  createWorker(w: InsertWorker): Promise<Worker>;
  updateWorker(id: number, data: Partial<InsertWorker>): Promise<Worker | undefined>;

  // Attendance
  getAttendance(siteId: number, date: string): Promise<Attendance[]>;
  getAttendanceRange(siteId: number, from: string, to: string): Promise<Attendance[]>;
  getAttendanceSummary(siteId: number, month: string): Promise<{ present: number; absent: number; halfDay: number }>;
  getAttendanceByWorkerMonth(workerId: number, month: string): Promise<{ present: number; half: number; absent: number }>;
  createAttendance(a: InsertAttendance): Promise<Attendance>;
  bulkCreateAttendance(records: InsertAttendance[]): Promise<Attendance[]>;
  updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<void>;

  // DPR
  getDpr(siteId: number, date: string): Promise<Dpr | undefined>;
  getDprHistory(siteId: number, from: string, to: string): Promise<Dpr[]>;
  createDpr(d: InsertDpr): Promise<Dpr>;
  updateDpr(id: number, data: Partial<InsertDpr>): Promise<Dpr | undefined>;

  // Expenses
  getExpenses(siteId: number, date?: string): Promise<Expense[]>;
  getExpensesByMonth(siteId: number, month: string): Promise<Expense[]>;
  getExpensesRange(siteId: number, from: string, to: string): Promise<Expense[]>;
  getExpenseSummary(siteId: number, month: string): Promise<{ category: string; total: number }[]>;
  createExpense(e: InsertExpense): Promise<Expense>;
  updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<void>;

  // Payroll
  getPayroll(siteId?: number, month?: string): Promise<Payroll[]>;
  getPayrollByWorker(workerId: number): Promise<Payroll[]>;
  upsertPayroll(data: InsertPayroll): Promise<Payroll>;
  updatePayroll(id: number, data: Partial<InsertPayroll>): Promise<Payroll | undefined>;
  generatePayroll(siteId: number, month: string): Promise<Payroll[]>;

  // Advances
  getAdvances(workerId: number): Promise<Advance[]>;
  getAdvancesByMonth(workerId: number, month: string): Promise<Advance[]>;
  createAdvance(a: InsertAdvance): Promise<Advance>;

  // Subscriptions
  getSubscription(userId: number): Promise<Subscription | undefined>;
  getSubscriptionByGatewayId(gatewaySubscriptionId: string): Promise<Subscription | undefined>;
  createSubscription(data: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  upsertUserSubscription(userId: number, data: Partial<InsertSubscription>): Promise<Subscription>;

  // Dashboard
  getDashboardStats(siteId?: number, userId?: number): Promise<{
    activeSites: number;
    todayAttendance: number;
    todayExpenses: number;
    pendingDprs: number;
    totalWorkers: number;
    monthlyPayroll: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // ─── Users ───
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).then(res => res[0]);
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.email, email)).then(res => res[0]);
  }
  async getUsers(companyId?: number): Promise<User[]> {
    if (companyId == null) return db.select().from(users);
    return db.select().from(users).where(eq((users as any).companyId, companyId));
  }
  async createUser(user: InsertUser): Promise<User> {
    const created = await db.insert(users).values(user).returning().then(res => res[0]);
    // If no companyId was provided (self-serve signup), default to own id (own company)
    if (created.companyId == null) {
      const updated = await db.update(users)
        .set({ companyId: created.id })
        .where(eq(users.id, created.id))
        .returning()
        .then(res => res[0]);
      return updated;
    }
    return created;
  }
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    return db.update(users).set(data).where(eq(users.id, id)).returning().then(res => res[0]);
  }

  // ─── Sites ───
  async getSites(userId: number): Promise<Site[]> {
    return db.select().from(sites).where(eq(sites.createdBy, userId));
  }
  async getSite(id: number): Promise<Site | undefined> {
    return db.select().from(sites).where(eq(sites.id, id)).then(res => res[0]);
  }
  async createSite(site: InsertSite): Promise<Site> {
    return db.insert(sites).values(site).returning().then(res => res[0]);
  }
  async updateSite(id: number, data: Partial<InsertSite>): Promise<Site | undefined> {
    return db.update(sites).set(data).where(eq(sites.id, id)).returning().then(res => res[0]);
  }
  async deleteSite(id: number): Promise<void> {
    db.delete(sites).where(eq(sites.id, id)).run();
  }

  // ─── Contractors ───
  async getContractors(userId: number, status?: string): Promise<Contractor[]> {
    const conditions: any[] = [eq((contractors as any).userId, userId)];
    if (status && status !== "all") conditions.push(eq(contractors.status, status as any));
    return db.select().from(contractors).where(and(...conditions));
  }
  async getContractor(id: number): Promise<Contractor | undefined> {
    return db.select().from(contractors).where(eq(contractors.id, id)).then(res => res[0]);
  }
  async createContractor(c: InsertContractor): Promise<Contractor> {
    return db.insert(contractors).values({
      ...c,
      createdAt: new Date().toISOString(),
    } as any).returning().then(res => res[0]);
  }
  async updateContractor(id: number, data: Partial<InsertContractor>): Promise<Contractor | undefined> {
    return db.update(contractors).set(data).where(eq(contractors.id, id)).returning().then(res => res[0]);
  }

  // ─── Workers ───
  async getWorkers(siteId?: number, status?: string): Promise<Worker[]> {
    let query = db.select().from(workers);
    const conditions = [];
    if (siteId) conditions.push(eq(workers.siteId, siteId));
    if (status && status !== "all") conditions.push(eq(workers.status, status as any));
    if (conditions.length > 0) {
      return (query as any).where(and(...conditions));
    }
    return query;
  }
  async getWorker(id: number): Promise<Worker | undefined> {
    return db.select().from(workers).where(eq(workers.id, id)).then(res => res[0]);
  }
  async createWorker(w: InsertWorker): Promise<Worker> {
    return db.insert(workers).values({
      ...w,
      createdAt: new Date().toISOString(),
    } as any).returning().then(res => res[0]);
  }
  async updateWorker(id: number, data: Partial<InsertWorker>): Promise<Worker | undefined> {
    return db.update(workers).set(data).where(eq(workers.id, id)).returning().then(res => res[0]);
  }

  // ─── Attendance ───
  async getAttendance(siteId: number, date: string): Promise<Attendance[]> {
    return db.select().from(attendance)
      .where(and(eq(attendance.siteId, siteId), eq(attendance.date, date)))
      ;
  }
  async getAttendanceRange(siteId: number, from: string, to: string): Promise<Attendance[]> {
    return db.select().from(attendance)
      .where(and(
        eq(attendance.siteId, siteId),
        between(attendance.date, from, to)
      ))
      .orderBy(desc(attendance.date))
      ;
  }
  async getAttendanceSummary(siteId: number, month: string): Promise<{ present: number; absent: number; halfDay: number }> {
    const rows = await db.select().from(attendance)
      .where(and(
        eq(attendance.siteId, siteId),
        sql`substr(${attendance.date}, 1, 7) = ${month}`
      ));
    let present = 0, absent = 0, halfDay = 0;
    for (const r of rows) {
      if (r.status === "present") present++;
      else if (r.status === "absent") absent++;
      else halfDay++;
    }
    return { present, absent, halfDay };
  }
  async getAttendanceByWorkerMonth(workerId: number, month: string): Promise<{ present: number; half: number; absent: number }> {
    const rows = await db.select().from(attendance)
      .where(and(
        eq(attendance.workerId as any, workerId),
        sql`substr(${attendance.date}, 1, 7) = ${month}`
      ));
    let present = 0, half = 0, absent = 0;
    for (const r of rows) {
      if (r.status === "present") present++;
      else if (r.status === "half_day") half++;
      else absent++;
    }
    return { present, half, absent };
  }
  async createAttendance(a: InsertAttendance): Promise<Attendance> {
    return db.insert(attendance).values(a).returning().then(res => res[0]);
  }
  async bulkCreateAttendance(records: InsertAttendance[]): Promise<Attendance[]> {
    const results: Attendance[] = [];
    for (const rec of records) {
      const existing = await db.select().from(attendance)
        .where(and(
          eq(attendance.siteId, rec.siteId),
          eq(attendance.workerName, rec.workerName),
          eq(attendance.date, rec.date)
        ))
        .then(res => res[0]);
      if (existing) {
        const updated = await db.update(attendance)
          .set({ status: rec.status, checkIn: rec.checkIn ?? null, checkOut: rec.checkOut ?? null })
          .where(eq(attendance.id, existing.id))
          .returning()
          .then(res => res[0]);
        if (updated) results.push(updated);
      } else {
        const inserted = await db.insert(attendance).values(rec).returning().then(res => res[0]);
        results.push(inserted);
      }
    }
    return results;
  }
  async updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    return db.update(attendance).set(data).where(eq(attendance.id, id)).returning().then(res => res[0]);
  }
  async deleteAttendance(id: number): Promise<void> {
    await db.delete(attendance).where(eq(attendance.id, id));
  }

  // ─── DPR ───
  async getDpr(siteId: number, date: string): Promise<Dpr | undefined> {
    return db.select().from(dpr)
      .where(and(eq(dpr.siteId, siteId), eq(dpr.date, date)))
      .then(res => res[0]);
  }
  async getDprHistory(siteId: number, from: string, to: string): Promise<Dpr[]> {
    return db.select().from(dpr)
      .where(and(
        eq(dpr.siteId, siteId),
        between(dpr.date, from, to)
      ))
      .orderBy(desc(dpr.date))
      ;
  }
  async createDpr(d: InsertDpr): Promise<Dpr> {
    return db.insert(dpr).values(d).returning().then(res => res[0]);
  }
  async updateDpr(id: number, data: Partial<InsertDpr>): Promise<Dpr | undefined> {
    return db.update(dpr).set(data).where(eq(dpr.id, id)).returning().then(res => res[0]);
  }

  // ─── Expenses ───
  async getExpenses(siteId: number, date?: string): Promise<Expense[]> {
    if (date) {
      return db.select().from(expenses)
        .where(and(eq(expenses.siteId, siteId), eq(expenses.expenseDate, date)))
        .orderBy(desc(expenses.expenseDate))
        ;
    }
    return db.select().from(expenses)
      .where(eq(expenses.siteId, siteId))
      .orderBy(desc(expenses.expenseDate))
      ;
  }
  async getExpensesByMonth(siteId: number, month: string): Promise<Expense[]> {
    return db.select().from(expenses)
      .where(and(
        eq(expenses.siteId, siteId),
        sql`substr(${expenses.expenseDate}, 1, 7) = ${month}`
      ))
      .orderBy(desc(expenses.expenseDate))
      ;
  }
  async getExpensesRange(siteId: number, from: string, to: string): Promise<Expense[]> {
    return db.select().from(expenses)
      .where(and(
        eq(expenses.siteId, siteId),
        between(expenses.expenseDate, from, to)
      ))
      .orderBy(desc(expenses.expenseDate))
      ;
  }
  async getExpenseSummary(siteId: number, month: string): Promise<{ category: string; total: number }[]> {
    const rows = db.select({
      category: expenses.category,
      total: sql<number>`sum(${expenses.amount})`,
    }).from(expenses)
      .where(and(
        eq(expenses.siteId, siteId),
        sql`substr(${expenses.expenseDate}, 1, 7) = ${month}`
      ))
      .groupBy(expenses.category)
      ;
    return rows;
  }
  async createExpense(e: InsertExpense): Promise<Expense> {
    return db.insert(expenses).values(e).returning().then(res => res[0]);
  }
  async updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    return db.update(expenses).set(data).where(eq(expenses.id, id)).returning().then(res => res[0]);
  }
  async deleteExpense(id: number): Promise<void> {
    db.delete(expenses).where(eq(expenses.id, id)).run();
  }

  // ─── Payroll ───
  async getPayroll(siteId?: number, month?: string): Promise<Payroll[]> {
    const conditions = [];
    if (siteId) conditions.push(eq(payroll.siteId, siteId));
    if (month) conditions.push(eq(payroll.month, month));
    if (conditions.length > 0) {
      return db.select().from(payroll).where(and(...conditions));
    }
    return db.select().from(payroll);
  }
  async getPayrollByWorker(workerId: number): Promise<Payroll[]> {
    return db.select().from(payroll).where(eq(payroll.workerId, workerId)).orderBy(desc(payroll.month));
  }
  async upsertPayroll(data: InsertPayroll): Promise<Payroll> {
    // Check if payroll row already exists for this worker+site+month
    const existing = await db.select().from(payroll)
      .where(and(
        eq(payroll.workerId, data.workerId),
        eq(payroll.siteId, data.siteId),
        eq(payroll.month, data.month)
      ))
      .then(res => res[0]);
    if (existing) {
      return db.update(payroll).set(data).where(eq(payroll.id, existing.id)).returning().then(res => res[0])!;
    }
    return db.insert(payroll).values({
      ...data,
      createdAt: new Date().toISOString(),
    } as any).returning().then(res => res[0]);
  }
  async updatePayroll(id: number, data: Partial<InsertPayroll>): Promise<Payroll | undefined> {
    return db.update(payroll).set(data).where(eq(payroll.id, id)).returning().then(res => res[0]);
  }
  async generatePayroll(siteId: number, month: string): Promise<Payroll[]> {
    // Get all active workers for this site
    const siteWorkers = await db.select().from(workers)
      .where(and(eq(workers.siteId, siteId), eq(workers.status, "active")))
      ;

    const results: Payroll[] = [];
    const workingDaysInMonth = 26; // Standard Indian construction working days

    for (const worker of siteWorkers) {
      // Count attendance for this worker+month by worker_id
      const attRows = await db.select().from(attendance)
        .where(and(
          eq(attendance.siteId, siteId),
          sql`${attendance.workerId} = ${worker.id}`,
          sql`substr(${attendance.date}, 1, 7) = ${month}`
        ));

      // Fallback: match by name if no worker_id linked
      const attRowsByName = attRows.length === 0
        ? await db.select().from(attendance)
          .where(and(
            eq(attendance.siteId, siteId),
            eq(attendance.workerName, worker.name),
            sql`substr(${attendance.date}, 1, 7) = ${month}`
          ))
        : attRows;

      const presentDays = attRowsByName.filter((r: any) => r.status === "present").length;
      const halfDays = attRowsByName.filter(r => r.status === "half_day").length;
      const absentDays = attRowsByName.filter(r => r.status === "absent").length;

      // Sum advances for this worker in this month
      const advanceRows = await db.select().from(advances).where(and(eq(advances.workerId, worker.id), sql`substr(${advances.date}, 1, 7) = ${month}`));
      const totalAdvance = advanceRows.reduce((s, a) => s + a.amount, 0);

      // Calculate gross salary
      let grossSalary = 0;
      const effectiveDays = presentDays + halfDays * 0.5;
      if (worker.wageType === "daily") {
        grossSalary = effectiveDays * worker.dailyWage;
      } else {
        const daily = (worker.monthlySalary ?? 0) / workingDaysInMonth;
        grossSalary = effectiveDays * daily;
      }

      const netSalary = Math.max(0, grossSalary - totalAdvance);

      const row = await this.upsertPayroll({
        workerId: worker.id,
        siteId,
        month,
        presentDays,
        halfDays,
        absentDays,
        overtimeHours: 0,
        advance: totalAdvance,
        deduction: 0,
        grossSalary: Math.round(grossSalary * 100) / 100,
        netSalary: Math.round(netSalary * 100) / 100,
        status: "pending",
      });
      results.push(row);
    }
    return results;
  }

  // ─── Advances ───
  async getAdvances(workerId: number): Promise<Advance[]> {
    return db.select().from(advances).where(eq(advances.workerId, workerId)).orderBy(desc(advances.date));
  }
  async getAdvancesByMonth(workerId: number, month: string): Promise<Advance[]> {
    return db.select().from(advances)
      .where(and(
        eq(advances.workerId, workerId),
        sql`substr(${advances.date}, 1, 7) = ${month}`
      ))
      ;
  }
  async createAdvance(a: InsertAdvance): Promise<Advance> {
    return db.insert(advances).values({
      ...a,
      createdAt: new Date().toISOString(),
    } as any).returning().then(res => res[0]);
  }

  // ─── Dashboard ───
  async getDashboardStats(siteId?: number, userId?: number): Promise<{
    activeSites: number;
    todayAttendance: number;
    todayExpenses: number;
    pendingDprs: number;
    totalWorkers: number;
    monthlyPayroll: number;
  }> {
    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = today.slice(0, 7);

    // Scope site queries to userId when provided
    const siteConditions: any[] = [eq(sites.status, "active")];
    if (userId) siteConditions.push(eq(sites.createdBy, userId));
    const activeSites = (await db.select({ count: sql<number>`count(*)` }).from(sites).where(and(...siteConditions)))[0]?.count ?? 0;

    // Get site IDs belonging to this user to scope workers/attendance/expenses
    const userSiteIds = userId
      ? (await db.select({ id: sites.id }).from(sites).where(eq(sites.createdBy, userId))).map(s => s.id)
      : null;

    const workerConditions: any[] = [eq(workers.status, "active")];
    if (userSiteIds && userSiteIds.length > 0) workerConditions.push(sql`${workers.siteId} IN (${sql.join(userSiteIds.map(id => sql`${id}`), sql`, `)})`);
    else if (userSiteIds && userSiteIds.length === 0) workerConditions.push(sql`1=0`);
    const totalWorkers = (await db.select({ count: sql<number>`count(*)` }).from(workers).where(and(...workerConditions)))[0]?.count ?? 0;

    const payrollConditions: any[] = [eq(payroll.month, currentMonth)];
    if (userSiteIds && userSiteIds.length > 0) payrollConditions.push(sql`${payroll.siteId} IN (${sql.join(userSiteIds.map(id => sql`${id}`), sql`, `)})`);
    else if (userSiteIds && userSiteIds.length === 0) payrollConditions.push(sql`1=0`);
    const monthlyPayrollResult = (await db.select({ total: sql<number>`coalesce(sum(net_salary), 0)` }).from(payroll).where(and(...payrollConditions)))[0]?.total ?? 0;

    let todayAttendance: number;
    let todayExpensesTotal: number;
    let pendingDprs: number;

    if (siteId) {
      todayAttendance = (await db.select({ count: sql<number>`count(*)` }).from(attendance).where(and(eq(attendance.siteId, siteId), eq(attendance.date, today), eq(attendance.status, "present"))))[0]?.count ?? 0;

      todayExpensesTotal = (await db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(and(eq(expenses.siteId, siteId), eq(expenses.expenseDate, today))))[0]?.total ?? 0;

      const dprExists = (await db.select({ count: sql<number>`count(*)` }).from(dpr).where(and(eq(dpr.siteId, siteId), eq(dpr.date, today))))[0]?.count ?? 0;
      pendingDprs = dprExists > 0 ? 0 : 1;
    } else {
      const attConditions: any[] = [eq(attendance.date, today), eq(attendance.status, "present")];
      if (userSiteIds && userSiteIds.length > 0) attConditions.push(sql`${attendance.siteId} IN (${sql.join(userSiteIds.map(id => sql`${id}`), sql`, `)})`);
      else if (userSiteIds && userSiteIds.length === 0) attConditions.push(sql`1=0`);
      todayAttendance = (await db.select({ count: sql<number>`count(*)` }).from(attendance).where(and(...attConditions)))[0]?.count ?? 0;

      const expConditions: any[] = [eq(expenses.expenseDate, today)];
      if (userSiteIds && userSiteIds.length > 0) expConditions.push(sql`${expenses.siteId} IN (${sql.join(userSiteIds.map(id => sql`${id}`), sql`, `)})`);
      else if (userSiteIds && userSiteIds.length === 0) expConditions.push(sql`1=0`);
      todayExpensesTotal = (await db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(and(...expConditions)))[0]?.total ?? 0;

      const allActiveSites = userId
        ? await db.select({ id: sites.id }).from(sites).where(and(eq(sites.status, "active"), eq(sites.createdBy, userId)))
        : await db.select({ id: sites.id }).from(sites).where(eq(sites.status, "active"));
      const sitesWithDpr = await db.select({ siteId: dpr.siteId }).from(dpr).where(eq(dpr.date, today));
      const sitesWithDprIds = new Set(sitesWithDpr.map(s => s.siteId));
      pendingDprs = allActiveSites.filter(s => !sitesWithDprIds.has(s.id)).length;
    }

    return {
      activeSites,
      todayAttendance,
      todayExpenses: todayExpensesTotal,
      pendingDprs,
      totalWorkers,
      monthlyPayroll: monthlyPayrollResult,
    };
  }

  // ─── Subscriptions ───
  async getSubscription(userId: number): Promise<Subscription | undefined> {
    return db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1)
      .then(res => res[0]);
  }

  async getSubscriptionByGatewayId(gatewaySubscriptionId: string): Promise<Subscription | undefined> {
    return db.select().from(subscriptions)
      .where(eq(subscriptions.gatewaySubscriptionId, gatewaySubscriptionId))
      .then(res => res[0]);
  }

  async createSubscription(data: InsertSubscription): Promise<Subscription> {
    const now = new Date().toISOString();
    return db.insert(subscriptions)
      .values({ ...data, createdAt: now, updatedAt: now } as any)
      .returning()
      .then(res => res[0]);
  }

  async updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    return db.update(subscriptions)
      .set({ ...data, updatedAt: new Date().toISOString() } as any)
      .where(eq(subscriptions.id, id))
      .returning()
      .then(res => res[0]);
  }

  async upsertUserSubscription(userId: number, data: Partial<InsertSubscription>): Promise<Subscription> {
    const existing = await this.getSubscription(userId);
    if (existing) {
      const updated = await this.updateSubscription(existing.id, data);
      return updated!;
    } else {
      return this.createSubscription({
        userId,
        planCode: data.planCode ?? "free_trial",
        billingInterval: data.billingInterval ?? "monthly",
        status: data.status ?? "trialing",
        ...data,
      } as InsertSubscription);
    }
  }
}

export const storage = new DatabaseStorage();
