import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Users ───
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  mobile: text("mobile"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "supervisor", "staff"] }).notNull().default("staff"),
  siteId: integer("site_id"),
  /** Multi-tenancy boundary. For self-signup admins, companyId = their own user.id.
   *  For invited users, companyId = inviter's companyId. Used to scope all data. */
  companyId: integer("company_id"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  preferredLanguage: text("preferred_language", { length: 5 }).notNull().default("en"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Sites ───
export const sites = sqliteTable("sites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  clientName: text("client_name").notNull(),
  location: text("location"),
  startDate: text("start_date"),
  status: text("status", { enum: ["active", "completed", "paused"] }).notNull().default("active"),
  createdBy: integer("created_by").notNull(),
  /** Tenancy: company that owns this site (= owner admin's user.id). */
  companyId: integer("company_id"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertSiteSchema = createInsertSchema(sites).omit({ id: true, createdAt: true });
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Site = typeof sites.$inferSelect;

// ─── Contractors ───
export const contractors = sqliteTable("contractors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  /** Tenancy: company that owns this contractor record. */
  companyId: integer("company_id"),
  name: text("name").notNull(),
  companyName: text("company_name"),
  phone: text("phone"),
  gstNumber: text("gst_number"),
  paymentTerms: text("payment_terms", { enum: ["weekly", "biweekly", "monthly"] }).default("monthly"),
  bankAccount: text("bank_account"),
  ifscCode: text("ifsc_code"),
  address: text("address"),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertContractorSchema = createInsertSchema(contractors).omit({ id: true, createdAt: true });
export type InsertContractor = z.infer<typeof insertContractorSchema>;
export type Contractor = typeof contractors.$inferSelect;

// ─── Workers ───
export const workers = sqliteTable("workers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Tenancy: company that owns this worker record. */
  companyId: integer("company_id"),
  name: text("name").notNull(),
  phone: text("phone"),
  trade: text("trade"),
  contractorId: integer("contractor_id"),
  siteId: integer("site_id"),
  wageType: text("wage_type", { enum: ["daily", "monthly"] }).notNull().default("daily"),
  dailyWage: real("daily_wage").notNull().default(0),
  monthlySalary: real("monthly_salary"),
  overtimeRate: real("overtime_rate").default(0),
  joiningDate: text("joining_date"),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertWorkerSchema = createInsertSchema(workers).omit({ id: true, createdAt: true });
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type Worker = typeof workers.$inferSelect;

// ─── Attendance ───
export const attendance = sqliteTable("attendance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Tenancy: company that owns this attendance row. */
  companyId: integer("company_id"),
  siteId: integer("site_id").notNull(),
  workerId: integer("worker_id"),          // nullable — links to workers table
  workerName: text("worker_name").notNull(),
  contractorName: text("contractor_name"),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  status: text("status", { enum: ["present", "absent", "half_day"] }).notNull().default("present"),
  date: text("date").notNull(),
  createdBy: integer("created_by"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

// ─── DPR (Daily Progress Report) ───
export const dpr = sqliteTable("dpr", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Tenancy: company that owns this DPR. */
  companyId: integer("company_id"),
  siteId: integer("site_id").notNull(),
  date: text("date").notNull(),
  workDone: text("work_done").notNull(),
  manpowerCount: integer("manpower_count"),
  contractorName: text("contractor_name"),
  materialUsed: text("material_used"),
  machineryUsed: text("machinery_used"),
  delayReason: text("delay_reason"),
  remarks: text("remarks"),
  photos: text("photos"), // JSON stringified array
  submittedBy: integer("submitted_by"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  siteDateIdx: uniqueIndex("dpr_site_date_idx").on(table.siteId, table.date),
}));

export const insertDprSchema = createInsertSchema(dpr).omit({ id: true, createdAt: true });
export type InsertDpr = z.infer<typeof insertDprSchema>;
export type Dpr = typeof dpr.$inferSelect;

// ─── Expenses ───
export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Tenancy: company that owns this expense. */
  companyId: integer("company_id"),
  siteId: integer("site_id").notNull(),
  category: text("category", { enum: ["labour", "material", "equipment", "transport", "food", "misc"] }).notNull(),
  amount: real("amount").notNull(),
  vendorName: text("vendor_name"),
  paymentMode: text("payment_mode", { enum: ["cash", "upi", "bank"] }).notNull().default("cash"),
  billPhoto: text("bill_photo"),
  notes: text("notes"),
  expenseDate: text("expense_date").notNull(),
  addedBy: integer("added_by"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// ─── Payroll ───
export const payroll = sqliteTable("payroll", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Tenancy: company that owns this payroll row. */
  companyId: integer("company_id"),
  workerId: integer("worker_id").notNull(),
  siteId: integer("site_id").notNull(),
  month: text("month").notNull(),             // YYYY-MM
  presentDays: real("present_days").notNull().default(0),
  halfDays: real("half_days").notNull().default(0),
  absentDays: real("absent_days").notNull().default(0),
  overtimeHours: real("overtime_hours").notNull().default(0),
  advance: real("advance").notNull().default(0),
  deduction: real("deduction").notNull().default(0),
  grossSalary: real("gross_salary").notNull().default(0),
  netSalary: real("net_salary").notNull().default(0),
  status: text("status", { enum: ["pending", "paid"] }).notNull().default("pending"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertPayrollSchema = createInsertSchema(payroll).omit({ id: true, createdAt: true });
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payroll.$inferSelect;

// ─── Advances ───
export const advances = sqliteTable("advances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Tenancy: company that owns this advance. */
  companyId: integer("company_id"),
  workerId: integer("worker_id").notNull(),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertAdvanceSchema = createInsertSchema(advances).omit({ id: true, createdAt: true });
export type InsertAdvance = z.infer<typeof insertAdvanceSchema>;
export type Advance = typeof advances.$inferSelect;

// ─── Expense categories constant ───
export const EXPENSE_CATEGORIES = ["labour", "material", "equipment", "transport", "food", "misc"] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  labour: "Labour",
  material: "Material",
  equipment: "Equipment",
  transport: "Transport",
  food: "Food",
  misc: "Misc",
};

// ─── Subscriptions ───
export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  planCode: text("plan_code", { enum: ["free_trial", "starter", "pro", "business"] }).notNull(),
  billingInterval: text("billing_interval", { enum: ["monthly", "yearly"] }).notNull().default("monthly"),
  gateway: text("gateway", { enum: ["razorpay", "stripe"] }),
  gatewaySubscriptionId: text("gateway_subscription_id"),
  gatewayCustomerId: text("gateway_customer_id"),
  status: text("status", { enum: ["trialing", "active", "cancelled", "expired", "past_due"] }).notNull().default("trialing"),
  currentPeriodStart: text("current_period_start"),
  currentPeriodEnd: text("current_period_end"),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
