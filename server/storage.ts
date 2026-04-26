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
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, between, sql, desc, gte, lte } from "drizzle-orm";

const sqlite = new Database(process.env.DATABASE_URL || "data.db");
sqlite.pragma("journal_mode = WAL");

// ─── Auto-migration: create new tables if they don't exist ───────────────────
sqlite.exec(`
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
  sqlite.exec(`ALTER TABLE attendance ADD COLUMN worker_id INTEGER`);
} catch {
  // Column already exists — ignore
}

export const db = drizzle(sqlite);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;

  // Sites
  getSites(): Promise<Site[]>;
  getSite(id: number): Promise<Site | undefined>;
  createSite(site: InsertSite): Promise<Site>;
  updateSite(id: number, data: Partial<InsertSite>): Promise<Site | undefined>;
  deleteSite(id: number): Promise<void>;

  // Contractors
  getContractors(status?: string): Promise<Contractor[]>;
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

  // Dashboard
  getDashboardStats(siteId?: number): Promise<{
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
    return db.select().from(users).where(eq(users.id, id)).get();
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.email, email)).get();
  }
  async getUsers(): Promise<User[]> {
    return db.select().from(users).all();
  }
  async createUser(user: InsertUser): Promise<User> {
    return db.insert(users).values(user).returning().get();
  }
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    return db.update(users).set(data).where(eq(users.id, id)).returning().get();
  }

  // ─── Sites ───
  async getSites(): Promise<Site[]> {
    return db.select().from(sites).all();
  }
  async getSite(id: number): Promise<Site | undefined> {
    return db.select().from(sites).where(eq(sites.id, id)).get();
  }
  async createSite(site: InsertSite): Promise<Site> {
    return db.insert(sites).values(site).returning().get();
  }
  async updateSite(id: number, data: Partial<InsertSite>): Promise<Site | undefined> {
    return db.update(sites).set(data).where(eq(sites.id, id)).returning().get();
  }
  async deleteSite(id: number): Promise<void> {
    db.delete(sites).where(eq(sites.id, id)).run();
  }

  // ─── Contractors ───
  async getContractors(status?: string): Promise<Contractor[]> {
    if (status && status !== "all") {
      return db.select().from(contractors).where(eq(contractors.status, status as any)).all();
    }
    return db.select().from(contractors).all();
  }
  async getContractor(id: number): Promise<Contractor | undefined> {
    return db.select().from(contractors).where(eq(contractors.id, id)).get();
  }
  async createContractor(c: InsertContractor): Promise<Contractor> {
    return db.insert(contractors).values({
      ...c,
      createdAt: new Date().toISOString(),
    } as any).returning().get();
  }
  async updateContractor(id: number, data: Partial<InsertContractor>): Promise<Contractor | undefined> {
    return db.update(contractors).set(data).where(eq(contractors.id, id)).returning().get();
  }

  // ─── Workers ───
  async getWorkers(siteId?: number, status?: string): Promise<Worker[]> {
    let query = db.select().from(workers);
    const conditions = [];
    if (siteId) conditions.push(eq(workers.siteId, siteId));
    if (status && status !== "all") conditions.push(eq(workers.status, status as any));
    if (conditions.length > 0) {
      return (query as any).where(and(...conditions)).all();
    }
    return query.all();
  }
  async getWorker(id: number): Promise<Worker | undefined> {
    return db.select().from(workers).where(eq(workers.id, id)).get();
  }
  async createWorker(w: InsertWorker): Promise<Worker> {
    return db.insert(workers).values({
      ...w,
      createdAt: new Date().toISOString(),
    } as any).returning().get();
  }
  async updateWorker(id: number, data: Partial<InsertWorker>): Promise<Worker | undefined> {
    return db.update(workers).set(data).where(eq(workers.id, id)).returning().get();
  }

  // ─── Attendance ───
  async getAttendance(siteId: number, date: string): Promise<Attendance[]> {
    return db.select().from(attendance)
      .where(and(eq(attendance.siteId, siteId), eq(attendance.date, date)))
      .all();
  }
  async getAttendanceRange(siteId: number, from: string, to: string): Promise<Attendance[]> {
    return db.select().from(attendance)
      .where(and(
        eq(attendance.siteId, siteId),
        between(attendance.date, from, to)
      ))
      .orderBy(desc(attendance.date))
      .all();
  }
  async getAttendanceSummary(siteId: number, month: string): Promise<{ present: number; absent: number; halfDay: number }> {
    const rows = db.select().from(attendance)
      .where(and(
        eq(attendance.siteId, siteId),
        sql`substr(${attendance.date}, 1, 7) = ${month}`
      )).all();
    let present = 0, absent = 0, halfDay = 0;
    for (const r of rows) {
      if (r.status === "present") present++;
      else if (r.status === "absent") absent++;
      else halfDay++;
    }
    return { present, absent, halfDay };
  }
  async getAttendanceByWorkerMonth(workerId: number, month: string): Promise<{ present: number; half: number; absent: number }> {
    const rows = db.select().from(attendance)
      .where(and(
        eq(attendance.workerId as any, workerId),
        sql`substr(${attendance.date}, 1, 7) = ${month}`
      )).all();
    let present = 0, half = 0, absent = 0;
    for (const r of rows) {
      if (r.status === "present") present++;
      else if (r.status === "half_day") half++;
      else absent++;
    }
    return { present, half, absent };
  }
  async createAttendance(a: InsertAttendance): Promise<Attendance> {
    return db.insert(attendance).values(a).returning().get();
  }
  async bulkCreateAttendance(records: InsertAttendance[]): Promise<Attendance[]> {
    const results: Attendance[] = [];
    for (const rec of records) {
      const existing = db.select().from(attendance)
        .where(and(
          eq(attendance.siteId, rec.siteId),
          eq(attendance.workerName, rec.workerName),
          eq(attendance.date, rec.date)
        ))
        .get();
      if (existing) {
        const updated = db.update(attendance)
          .set({ status: rec.status, checkIn: rec.checkIn ?? null, checkOut: rec.checkOut ?? null })
          .where(eq(attendance.id, existing.id))
          .returning()
          .get();
        if (updated) results.push(updated);
      } else {
        const inserted = db.insert(attendance).values(rec).returning().get();
        results.push(inserted);
      }
    }
    return results;
  }
  async updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    return db.update(attendance).set(data).where(eq(attendance.id, id)).returning().get();
  }
  async deleteAttendance(id: number): Promise<void> {
    db.delete(attendance).where(eq(attendance.id, id)).run();
  }

  // ─── DPR ───
  async getDpr(siteId: number, date: string): Promise<Dpr | undefined> {
    return db.select().from(dpr)
      .where(and(eq(dpr.siteId, siteId), eq(dpr.date, date)))
      .get();
  }
  async getDprHistory(siteId: number, from: string, to: string): Promise<Dpr[]> {
    return db.select().from(dpr)
      .where(and(
        eq(dpr.siteId, siteId),
        between(dpr.date, from, to)
      ))
      .orderBy(desc(dpr.date))
      .all();
  }
  async createDpr(d: InsertDpr): Promise<Dpr> {
    return db.insert(dpr).values(d).returning().get();
  }
  async updateDpr(id: number, data: Partial<InsertDpr>): Promise<Dpr | undefined> {
    return db.update(dpr).set(data).where(eq(dpr.id, id)).returning().get();
  }

  // ─── Expenses ───
  async getExpenses(siteId: number, date?: string): Promise<Expense[]> {
    if (date) {
      return db.select().from(expenses)
        .where(and(eq(expenses.siteId, siteId), eq(expenses.expenseDate, date)))
        .orderBy(desc(expenses.expenseDate))
        .all();
    }
    return db.select().from(expenses)
      .where(eq(expenses.siteId, siteId))
      .orderBy(desc(expenses.expenseDate))
      .all();
  }
  async getExpensesByMonth(siteId: number, month: string): Promise<Expense[]> {
    return db.select().from(expenses)
      .where(and(
        eq(expenses.siteId, siteId),
        sql`substr(${expenses.expenseDate}, 1, 7) = ${month}`
      ))
      .orderBy(desc(expenses.expenseDate))
      .all();
  }
  async getExpensesRange(siteId: number, from: string, to: string): Promise<Expense[]> {
    return db.select().from(expenses)
      .where(and(
        eq(expenses.siteId, siteId),
        between(expenses.expenseDate, from, to)
      ))
      .orderBy(desc(expenses.expenseDate))
      .all();
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
      .all();
    return rows;
  }
  async createExpense(e: InsertExpense): Promise<Expense> {
    return db.insert(expenses).values(e).returning().get();
  }
  async updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    return db.update(expenses).set(data).where(eq(expenses.id, id)).returning().get();
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
      return db.select().from(payroll).where(and(...conditions)).all();
    }
    return db.select().from(payroll).all();
  }
  async getPayrollByWorker(workerId: number): Promise<Payroll[]> {
    return db.select().from(payroll).where(eq(payroll.workerId, workerId)).orderBy(desc(payroll.month)).all();
  }
  async upsertPayroll(data: InsertPayroll): Promise<Payroll> {
    // Check if payroll row already exists for this worker+site+month
    const existing = db.select().from(payroll)
      .where(and(
        eq(payroll.workerId, data.workerId),
        eq(payroll.siteId, data.siteId),
        eq(payroll.month, data.month)
      ))
      .get();
    if (existing) {
      return db.update(payroll).set(data).where(eq(payroll.id, existing.id)).returning().get()!;
    }
    return db.insert(payroll).values({
      ...data,
      createdAt: new Date().toISOString(),
    } as any).returning().get();
  }
  async updatePayroll(id: number, data: Partial<InsertPayroll>): Promise<Payroll | undefined> {
    return db.update(payroll).set(data).where(eq(payroll.id, id)).returning().get();
  }
  async generatePayroll(siteId: number, month: string): Promise<Payroll[]> {
    // Get all active workers for this site
    const siteWorkers = db.select().from(workers)
      .where(and(eq(workers.siteId, siteId), eq(workers.status, "active")))
      .all();

    const results: Payroll[] = [];
    const workingDaysInMonth = 26; // Standard Indian construction working days

    for (const worker of siteWorkers) {
      // Count attendance for this worker+month by worker_id
      const attRows = db.select().from(attendance)
        .where(and(
          eq(attendance.siteId, siteId),
          sql`${attendance.workerId} = ${worker.id}`,
          sql`substr(${attendance.date}, 1, 7) = ${month}`
        ))
        .all();

      // Fallback: match by name if no worker_id linked
      const attRowsByName = attRows.length === 0
        ? db.select().from(attendance)
          .where(and(
            eq(attendance.siteId, siteId),
            eq(attendance.workerName, worker.name),
            sql`substr(${attendance.date}, 1, 7) = ${month}`
          ))
          .all()
        : attRows;

      const presentDays = attRowsByName.filter(r => r.status === "present").length;
      const halfDays = attRowsByName.filter(r => r.status === "half_day").length;
      const absentDays = attRowsByName.filter(r => r.status === "absent").length;

      // Sum advances for this worker in this month
      const advanceRows = db.select().from(advances)
        .where(and(
          eq(advances.workerId, worker.id),
          sql`substr(${advances.date}, 1, 7) = ${month}`
        ))
        .all();
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
    return db.select().from(advances).where(eq(advances.workerId, workerId)).orderBy(desc(advances.date)).all();
  }
  async getAdvancesByMonth(workerId: number, month: string): Promise<Advance[]> {
    return db.select().from(advances)
      .where(and(
        eq(advances.workerId, workerId),
        sql`substr(${advances.date}, 1, 7) = ${month}`
      ))
      .all();
  }
  async createAdvance(a: InsertAdvance): Promise<Advance> {
    return db.insert(advances).values({
      ...a,
      createdAt: new Date().toISOString(),
    } as any).returning().get();
  }

  // ─── Dashboard ───
  async getDashboardStats(siteId?: number): Promise<{
    activeSites: number;
    todayAttendance: number;
    todayExpenses: number;
    pendingDprs: number;
    totalWorkers: number;
    monthlyPayroll: number;
  }> {
    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = today.slice(0, 7);

    const activeSites = db.select({ count: sql<number>`count(*)` })
      .from(sites).where(eq(sites.status, "active")).get()?.count ?? 0;

    const totalWorkers = db.select({ count: sql<number>`count(*)` })
      .from(workers).where(eq(workers.status, "active")).get()?.count ?? 0;

    const monthlyPayrollResult = db.select({ total: sql<number>`coalesce(sum(net_salary), 0)` })
      .from(payroll)
      .where(eq(payroll.month, currentMonth))
      .get()?.total ?? 0;

    let todayAttendance: number;
    let todayExpensesTotal: number;
    let pendingDprs: number;

    if (siteId) {
      todayAttendance = db.select({ count: sql<number>`count(*)` })
        .from(attendance)
        .where(and(eq(attendance.siteId, siteId), eq(attendance.date, today), eq(attendance.status, "present")))
        .get()?.count ?? 0;

      todayExpensesTotal = db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
        .from(expenses)
        .where(and(eq(expenses.siteId, siteId), eq(expenses.expenseDate, today)))
        .get()?.total ?? 0;

      const dprExists = db.select({ count: sql<number>`count(*)` })
        .from(dpr)
        .where(and(eq(dpr.siteId, siteId), eq(dpr.date, today)))
        .get()?.count ?? 0;
      pendingDprs = dprExists > 0 ? 0 : 1;
    } else {
      todayAttendance = db.select({ count: sql<number>`count(*)` })
        .from(attendance)
        .where(and(eq(attendance.date, today), eq(attendance.status, "present")))
        .get()?.count ?? 0;

      todayExpensesTotal = db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
        .from(expenses)
        .where(eq(expenses.expenseDate, today))
        .get()?.total ?? 0;

      const sitesWithDpr = db.select({ siteId: dpr.siteId })
        .from(dpr).where(eq(dpr.date, today)).all();
      const sitesWithDprIds = new Set(sitesWithDpr.map(s => s.siteId));
      const allActiveSites = db.select({ id: sites.id })
        .from(sites).where(eq(sites.status, "active")).all();
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
}

export const storage = new DatabaseStorage();
