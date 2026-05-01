import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { requireAuth } from "./auth";
import {
  insertSiteSchema,
  insertAttendanceSchema,
  insertDprSchema,
  insertExpenseSchema,
  insertUserSchema,
  insertWorkerSchema,
  insertContractorSchema,
  insertPayrollSchema,
  insertAdvanceSchema,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from "@shared/schema";
import { z } from "zod";
import {
  createRazorpaySubscription,
  cancelRazorpaySubscription,
  verifyRazorpayWebhook,
  createStripeCheckoutSession,
  cancelStripeSubscription,
  constructStripeEvent,
} from "./payments";

// ─── CSV helpers ──────────────────────────────────────────────────────────────
function toCSV(rows: Record<string, any>[], columns: { key: string; label: string }[]): string {
  const header = columns.map(c => `"${c.label}"`).join(",");
  const body = rows.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? "";
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [header, ...body].join("\n");
}

// ─── Photo upload helper ──────────────────────────────────────────────────────
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = Number(process.env.MAX_UPLOAD_SIZE_MB || 5) * 1024 * 1024;
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

function saveBase64Photo(dataUrl: string): string {
  // dataUrl format: data:<mime>;base64,<data>
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data");
  const [, mime, base64] = match;
  if (!ALLOWED_MIME.includes(mime)) throw new Error(`Unsupported image type: ${mime}. Allowed: jpeg, png, webp, gif`);
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > MAX_SIZE_BYTES) throw new Error(`Image too large. Max ${process.env.MAX_UPLOAD_SIZE_MB || 5}MB`);
  const ext = mime.split("/")[1].replace("jpeg", "jpg");
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Health check (public) ───────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ─── Keep-alive ping (public) — used by UptimeRobot / cron to prevent Render cold starts ──
  app.get("/api/ping", (_req, res) => {
    res.json({ pong: true, uptime: Math.floor(process.uptime()) + "s" });
  });

  // ─── Contact form (public) ───────────────────────────────────────────────────
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, mobile, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ error: "Name, email and message are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      // Log the contact form submission (in production, you could store in DB or send email)
      const contactEntry = {
        id: Date.now(),
        name,
        email,
        mobile: mobile || null,
        message,
        timestamp: new Date().toISOString(),
        source: "landing-page",
      };

      console.log("📬 New contact form submission:", JSON.stringify(contactEntry, null, 2));

      // Store in a simple JSON file for now (could be upgraded to email sending via SendGrid, Resend, etc.)
      const contactsFile = path.join(process.cwd(), "contacts.json");
      let contacts: typeof contactEntry[] = [];
      if (fs.existsSync(contactsFile)) {
        try {
          contacts = JSON.parse(fs.readFileSync(contactsFile, "utf-8"));
        } catch { }
      }
      contacts.push(contactEntry);
      fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2));

      res.json({
        success: true,
        message: "Thank you for reaching out! We'll get back to you within 24 hours.",
        id: contactEntry.id
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Failed to submit contact form. Please try again." });
    }
  });

  // ─── Seed data (public, dev only) ────────────────────────────────────────────
  app.post("/api/seed", async (_req, res) => {
    try {
      const existingSites = await storage.getSites(1);
      if (existingSites.length > 0) {
        return res.json({ message: "Data already seeded" });
      }

      await storage.createUser({
        name: "Pravin (Admin)",
        email: "admin@sitetrack.app",
        mobile: "9876543210",
        password: "admin123",
        role: "admin",
        active: true,
      });

      await storage.createUser({
        name: "Rajesh Patil",
        email: "rajesh@sitetrack.app",
        mobile: "9876543211",
        password: "pass123",
        role: "supervisor",
        siteId: 1,
        active: true,
      });

      const site1 = await storage.createSite({
        name: "Greenfield Residency",
        clientName: "Sharma Builders",
        location: "CIDCO, Chhatrapati Sambhajinagar",
        startDate: "2025-11-15",
        status: "active",
        createdBy: 1,
      });

      const site2 = await storage.createSite({
        name: "Metro Bridge Phase 2",
        clientName: "PWD Maharashtra",
        location: "Jalna Road, Chhatrapati Sambhajinagar",
        startDate: "2026-01-10",
        status: "active",
        createdBy: 1,
      });

      await storage.createSite({
        name: "Royal Heights Tower",
        clientName: "Royal Group",
        location: "Beed Bypass, Chhatrapati Sambhajinagar",
        startDate: "2025-08-01",
        status: "paused",
        createdBy: 1,
      });

      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      const workers = [
        { name: "Raju Kamble", contractor: "Patil Contractors" },
        { name: "Suresh Jadhav", contractor: "Patil Contractors" },
        { name: "Ganesh More", contractor: "Shinde & Sons" },
        { name: "Anil Pawar", contractor: "Shinde & Sons" },
        { name: "Vikas Wagh", contractor: "Patil Contractors" },
        { name: "Prem Kale", contractor: "Deshmukh Works" },
        { name: "Manoj Shinde", contractor: "Deshmukh Works" },
        { name: "Ramesh Gaikwad", contractor: "Patil Contractors" },
      ];

      for (const w of workers) {
        await storage.createAttendance({
          siteId: site1.id,
          workerName: w.name,
          contractorName: w.contractor,
          status: Math.random() > 0.2 ? "present" : Math.random() > 0.5 ? "absent" : "half_day",
          checkIn: "08:00",
          checkOut: Math.random() > 0.3 ? "17:00" : null,
          date: today,
          createdBy: 2,
        });
      }

      await storage.createDpr({
        siteId: site1.id,
        date: yesterday,
        workDone: "Completed RCC column casting for Block A, 3rd floor. Shuttering work started for Block B beam.",
        manpowerCount: 24,
        contractorName: "Patil Contractors + Shinde & Sons",
        materialUsed: "12 bags cement, 2 tons steel rebar, 4 cu.m sand, 6 cu.m aggregate",
        machineryUsed: "1 Concrete mixer, 1 JCB, 2 Vibrators",
        delayReason: "Minor delay due to late material delivery",
        remarks: "Quality check passed for column casting. Work progressing on schedule.",
        submittedBy: 2,
      });

      const expenseData = [
        { category: "labour" as const, amount: 45000, vendor: "Patil Contractors", mode: "bank" as const, date: today, notes: "Weekly labour payment" },
        { category: "material" as const, amount: 28500, vendor: "Ambuja Cement Dealer", mode: "upi" as const, date: today, notes: "12 bags cement + delivery" },
        { category: "material" as const, amount: 72000, vendor: "Tata Steel Distributor", mode: "bank" as const, date: yesterday, notes: "2 tons steel rebar" },
        { category: "equipment" as const, amount: 8500, vendor: "ABC Rentals", mode: "cash" as const, date: today, notes: "JCB rental - 1 day" },
        { category: "transport" as const, amount: 3500, vendor: "Local Transport", mode: "cash" as const, date: today, notes: "Material transport from depot" },
        { category: "food" as const, amount: 2400, vendor: "Sai Canteen", mode: "cash" as const, date: today, notes: "Worker lunch - 24 plates" },
        { category: "misc" as const, amount: 1500, vendor: "General Store", mode: "cash" as const, date: yesterday, notes: "Safety equipment, gloves" },
        { category: "labour" as const, amount: 18000, vendor: "Deshmukh Works", mode: "upi" as const, date: yesterday, notes: "Shuttering labour" },
      ];

      for (const e of expenseData) {
        await storage.createExpense({
          siteId: site1.id,
          category: e.category,
          amount: e.amount,
          vendorName: e.vendor,
          paymentMode: e.mode,
          expenseDate: e.date,
          notes: e.notes,
          addedBy: 2,
        });
      }

      res.json({ message: "Seed data created successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Photo upload ─────────────────────────────────────────────────────────────
  app.post("/api/upload/photo", requireAuth, async (req, res) => {
    try {
      const { dataUrl } = req.body;
      if (!dataUrl || typeof dataUrl !== "string") {
        return res.status(400).json({ error: "dataUrl is required" });
      }
      const url = saveBase64Photo(dataUrl);
      res.json({ url });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── Dashboard ───────────────────────────────────────────────────────────────
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id as number;
      const siteId = req.query.site_id ? Number(req.query.site_id) : undefined;
      const stats = await storage.getDashboardStats(siteId, userId);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Sites ───────────────────────────────────────────────────────────────────
  app.get("/api/sites", requireAuth, async (req, res) => {
    const userId = (req.user as any).id as number;
    const all = await storage.getSites(userId);
    res.json(all);
  });

  app.get("/api/sites/:id", requireAuth, async (req, res) => {
    const userId = (req.user as any).id as number;
    const site = await storage.getSite(Number(req.params.id));
    if (!site || site.createdBy !== userId) return res.status(404).json({ error: "Site not found" });
    res.json(site);
  });

  app.post("/api/sites", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id as number;
      const data = insertSiteSchema.parse({ ...req.body, createdBy: userId });
      const site = await storage.createSite(data);
      res.status(201).json(site);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/sites/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id as number;
      const existing = await storage.getSite(Number(req.params.id));
      if (!existing || existing.createdBy !== userId) return res.status(404).json({ error: "Site not found" });
      const site = await storage.updateSite(Number(req.params.id), req.body);
      res.json(site);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/sites/:id/status", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id as number;
      const existing = await storage.getSite(Number(req.params.id));
      if (!existing || existing.createdBy !== userId) return res.status(404).json({ error: "Site not found" });
      const { status } = req.body;
      if (!["active", "completed", "paused"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const site = await storage.updateSite(Number(req.params.id), { status });
      res.json(site);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/sites/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id as number;
      const existing = await storage.getSite(Number(req.params.id));
      if (!existing || existing.createdBy !== userId) return res.status(404).json({ error: "Site not found" });
      await storage.deleteSite(Number(req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Attendance ───────────────────────────────────────────────────────────────
  app.get("/api/attendance", requireAuth, async (req, res) => {
    try {
      const siteId = Number(req.query.site_id);
      const date = String(req.query.date);
      if (!siteId || !date) return res.status(400).json({ error: "site_id and date required" });
      const rows = await storage.getAttendance(siteId, date);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/attendance/summary", requireAuth, async (req, res) => {
    try {
      const siteId = Number(req.query.site_id);
      const month = String(req.query.month);
      if (!siteId || !month) return res.status(400).json({ error: "site_id and month required" });
      const summary = await storage.getAttendanceSummary(siteId, month);
      res.json(summary);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/attendance", requireAuth, async (req, res) => {
    try {
      const data = insertAttendanceSchema.parse(req.body);
      const record = await storage.createAttendance(data);
      res.status(201).json(record);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Bulk attendance: POST /api/attendance/bulk
  app.post("/api/attendance/bulk", requireAuth, async (req, res) => {
    try {
      const { records } = req.body as { records: any[] };
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: "records array is required" });
      }
      const parsed = z.array(insertAttendanceSchema).parse(records);
      const result = await storage.bulkCreateAttendance(parsed);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/attendance/:id", requireAuth, async (req, res) => {
    try {
      const record = await storage.updateAttendance(Number(req.params.id), req.body);
      if (!record) return res.status(404).json({ error: "Record not found" });
      res.json(record);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/attendance/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAttendance(Number(req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── DPR ─────────────────────────────────────────────────────────────────────
  app.get("/api/dpr", requireAuth, async (req, res) => {
    try {
      const siteId = Number(req.query.site_id);
      const date = String(req.query.date);
      if (!siteId || !date) return res.status(400).json({ error: "site_id and date required" });
      const record = await storage.getDpr(siteId, date);
      res.json(record || null);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/dpr/history", requireAuth, async (req, res) => {
    try {
      const siteId = Number(req.query.site_id);
      const from = String(req.query.from);
      const to = String(req.query.to);
      if (!siteId || !from || !to) return res.status(400).json({ error: "site_id, from, and to required" });
      const records = await storage.getDprHistory(siteId, from, to);
      res.json(records);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/dpr", requireAuth, async (req, res) => {
    try {
      const data = insertDprSchema.parse(req.body);
      const existing = await storage.getDpr(data.siteId, data.date);
      if (existing) return res.status(409).json({ error: "DPR already exists for this site and date" });
      const record = await storage.createDpr(data);
      res.status(201).json(record);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/dpr/:id", requireAuth, async (req, res) => {
    try {
      const record = await storage.updateDpr(Number(req.params.id), req.body);
      if (!record) return res.status(404).json({ error: "DPR not found" });
      res.json(record);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── Expenses ─────────────────────────────────────────────────────────────────
  app.get("/api/expenses", requireAuth, async (req, res) => {
    try {
      const siteId = Number(req.query.site_id);
      const date = req.query.date ? String(req.query.date) : undefined;
      if (!siteId) return res.status(400).json({ error: "site_id required" });
      const rows = await storage.getExpenses(siteId, date);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/expenses/month", requireAuth, async (req, res) => {
    try {
      const siteId = Number(req.query.site_id);
      const month = String(req.query.month);
      if (!siteId || !month) return res.status(400).json({ error: "site_id and month required" });
      const rows = await storage.getExpensesByMonth(siteId, month);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/expenses/summary", requireAuth, async (req, res) => {
    try {
      const siteId = Number(req.query.site_id);
      const month = String(req.query.month);
      if (!siteId || !month) return res.status(400).json({ error: "site_id and month required" });
      const summary = await storage.getExpenseSummary(siteId, month);
      res.json(summary);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/expenses/categories", requireAuth, (_req, res) => {
    res.json(EXPENSE_CATEGORIES);
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const data = insertExpenseSchema.parse(req.body);
      const record = await storage.createExpense(data);
      res.status(201).json(record);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const record = await storage.updateExpense(Number(req.params.id), req.body);
      if (!record) return res.status(404).json({ error: "Expense not found" });
      res.json(record);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteExpense(Number(req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Users ────────────────────────────────────────────────────────────────────
  app.get("/api/users", requireAuth, async (_req, res) => {
    const all = await storage.getUsers();
    res.json(all.map(u => ({ ...u, password: undefined })));
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ...user, password: undefined });
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json({ ...user, password: undefined });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const { password, ...rest } = req.body;
      const user = await storage.updateUser(Number(req.params.id), rest);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ ...user, password: undefined });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── Reports ──────────────────────────────────────────────────────────────────

  // GET /api/reports/attendance?site_id=&from=&to=&format=json|csv
  app.get("/api/reports/attendance", requireAuth, async (req, res) => {
    try {
      const siteId = Number(req.query.site_id);
      const from = String(req.query.from || "");
      const to = String(req.query.to || "");
      const format = String(req.query.format || "json");
      if (!siteId || !from || !to) return res.status(400).json({ error: "site_id, from, and to required" });

      const rows = await storage.getAttendanceRange(siteId, from, to);
      const site = await storage.getSite(siteId);

      const normalized = rows.map(r => ({
        date: r.date,
        workerName: r.workerName,
        contractorName: r.contractorName || "",
        status: r.status,
        checkIn: r.checkIn || "",
        checkOut: r.checkOut || "",
      }));

      if (format === "csv") {
        const csv = toCSV(normalized, [
          { key: "date", label: "Date" },
          { key: "workerName", label: "Worker Name" },
          { key: "contractorName", label: "Contractor" },
          { key: "status", label: "Status" },
          { key: "checkIn", label: "Check In" },
          { key: "checkOut", label: "Check Out" },
        ]);
        const filename = `attendance_${site?.name || siteId}_${from}_to_${to}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.send(csv);
      }

      const totals = {
        present: normalized.filter(r => r.status === "present").length,
        absent: normalized.filter(r => r.status === "absent").length,
        halfDay: normalized.filter(r => r.status === "half_day").length,
      };
      res.json({ rows: normalized, totals, site: site?.name });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/reports/expenses?site_id=&from=&to=&format=json|csv
  app.get("/api/reports/expenses", requireAuth, async (req, res) => {
    try {
      const siteId = Number(req.query.site_id);
      const from = String(req.query.from || "");
      const to = String(req.query.to || "");
      const format = String(req.query.format || "json");
      if (!siteId || !from || !to) return res.status(400).json({ error: "site_id, from, and to required" });

      const rows = await storage.getExpensesRange(siteId, from, to);
      const site = await storage.getSite(siteId);

      const normalized = rows.map(r => ({
        date: r.expenseDate,
        category: EXPENSE_CATEGORY_LABELS[r.category as keyof typeof EXPENSE_CATEGORY_LABELS] || r.category,
        vendorName: r.vendorName || "",
        amount: r.amount,
        paymentMode: r.paymentMode,
        notes: r.notes || "",
      }));

      if (format === "csv") {
        const csv = toCSV(normalized, [
          { key: "date", label: "Date" },
          { key: "category", label: "Category" },
          { key: "vendorName", label: "Vendor" },
          { key: "amount", label: "Amount (₹)" },
          { key: "paymentMode", label: "Payment Mode" },
          { key: "notes", label: "Notes" },
        ]);
        const filename = `expenses_${site?.name || siteId}_${from}_to_${to}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.send(csv);
      }

      const totalAmount = normalized.reduce((s, r) => s + r.amount, 0);
      const byCategory: Record<string, number> = {};
      for (const r of normalized) {
        byCategory[r.category] = (byCategory[r.category] || 0) + r.amount;
      }
      res.json({ rows: normalized, totalAmount, byCategory, site: site?.name });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/reports/dpr?site_id=&from=&to=&format=json|csv
  app.get("/api/reports/dpr", requireAuth, async (req, res) => {
    try {
      const siteId = Number(req.query.site_id);
      const from = String(req.query.from || "");
      const to = String(req.query.to || "");
      const format = String(req.query.format || "json");
      if (!siteId || !from || !to) return res.status(400).json({ error: "site_id, from, and to required" });

      const rows = await storage.getDprHistory(siteId, from, to);
      const site = await storage.getSite(siteId);

      const normalized = rows.map(r => ({
        date: r.date,
        workDone: r.workDone,
        manpowerCount: r.manpowerCount ?? "",
        contractorName: r.contractorName || "",
        materialUsed: r.materialUsed || "",
        machineryUsed: r.machineryUsed || "",
        delayReason: r.delayReason || "",
        remarks: r.remarks || "",
      }));

      if (format === "csv") {
        const csv = toCSV(normalized, [
          { key: "date", label: "Date" },
          { key: "workDone", label: "Work Done" },
          { key: "manpowerCount", label: "Manpower" },
          { key: "contractorName", label: "Contractor" },
          { key: "materialUsed", label: "Material Used" },
          { key: "machineryUsed", label: "Machinery" },
          { key: "delayReason", label: "Delay/Issues" },
          { key: "remarks", label: "Remarks" },
        ]);
        const filename = `dpr_${site?.name || siteId}_${from}_to_${to}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.send(csv);
      }

      res.json({ rows: normalized, total: normalized.length, site: site?.name });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Workers ─────────────────────────────────────────────────────────────────
  app.get("/api/workers", requireAuth, async (req, res) => {
    try {
      const siteId = req.query.site_id ? Number(req.query.site_id) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;
      const rows = await storage.getWorkers(siteId, status);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/workers/:id", requireAuth, async (req, res) => {
    const worker = await storage.getWorker(Number(req.params.id));
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    res.json(worker);
  });

  app.post("/api/workers", requireAuth, async (req, res) => {
    try {
      const data = insertWorkerSchema.parse(req.body);
      const worker = await storage.createWorker(data);
      res.status(201).json(worker);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.put("/api/workers/:id", requireAuth, async (req, res) => {
    try {
      const worker = await storage.updateWorker(Number(req.params.id), req.body);
      if (!worker) return res.status(404).json({ error: "Worker not found" });
      res.json(worker);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ─── Contractors ──────────────────────────────────────────────────────────────
  app.get("/api/contractors", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id as number;
      const status = req.query.status ? String(req.query.status) : undefined;
      const rows = await storage.getContractors(userId, status);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/contractors/:id", requireAuth, async (req, res) => {
    const c = await storage.getContractor(Number(req.params.id));
    if (!c) return res.status(404).json({ error: "Contractor not found" });
    res.json(c);
  });

  app.post("/api/contractors", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id as number;
      const data = insertContractorSchema.parse({ ...req.body, userId });
      const c = await storage.createContractor(data);
      res.status(201).json(c);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.put("/api/contractors/:id", requireAuth, async (req, res) => {
    try {
      const c = await storage.updateContractor(Number(req.params.id), req.body);
      if (!c) return res.status(404).json({ error: "Contractor not found" });
      res.json(c);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ─── Payroll ──────────────────────────────────────────────────────────────────
  app.get("/api/payroll", requireAuth, async (req, res) => {
    try {
      const siteId = req.query.site_id ? Number(req.query.site_id) : undefined;
      const month = req.query.month ? String(req.query.month) : undefined;
      const rows = await storage.getPayroll(siteId, month);
      // Enrich with worker name
      const enriched = await Promise.all(rows.map(async (r) => {
        const worker = await storage.getWorker(r.workerId);
        const site = await storage.getSite(r.siteId);
        return { ...r, workerName: worker?.name ?? "Unknown", siteName: site?.name ?? "" };
      }));
      res.json(enriched);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/payroll/generate", requireAuth, async (req, res) => {
    try {
      const { site_id, month } = req.body;
      if (!site_id || !month) return res.status(400).json({ error: "site_id and month required" });
      const rows = await storage.generatePayroll(Number(site_id), String(month));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/payroll/:id", requireAuth, async (req, res) => {
    try {
      const row = await storage.updatePayroll(Number(req.params.id), req.body);
      if (!row) return res.status(404).json({ error: "Payroll row not found" });
      res.json(row);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // GET /api/payroll/report?site_id=&month=&format=json|csv
  app.get("/api/payroll/report", requireAuth, async (req, res) => {
    try {
      const siteId = req.query.site_id ? Number(req.query.site_id) : undefined;
      const month = req.query.month ? String(req.query.month) : undefined;
      const format = String(req.query.format || "json");
      const rows = await storage.getPayroll(siteId, month);
      const enriched = await Promise.all(rows.map(async (r) => {
        const worker = await storage.getWorker(r.workerId);
        const site = await storage.getSite(r.siteId);
        return {
          workerName: worker?.name ?? "Unknown",
          site: site?.name ?? "",
          month: r.month,
          presentDays: r.presentDays,
          halfDays: r.halfDays,
          absentDays: r.absentDays,
          overtimeHours: r.overtimeHours,
          advance: r.advance,
          deduction: r.deduction,
          grossSalary: r.grossSalary,
          netSalary: r.netSalary,
          status: r.status,
        };
      }));
      if (format === "csv") {
        const csv = toCSV(enriched, [
          { key: "workerName", label: "Worker Name" },
          { key: "site", label: "Site" },
          { key: "month", label: "Month" },
          { key: "presentDays", label: "Present Days" },
          { key: "halfDays", label: "Half Days" },
          { key: "absentDays", label: "Absent Days" },
          { key: "overtimeHours", label: "OT Hours" },
          { key: "advance", label: "Advance (₹)" },
          { key: "deduction", label: "Deduction (₹)" },
          { key: "grossSalary", label: "Gross (₹)" },
          { key: "netSalary", label: "Net Salary (₹)" },
          { key: "status", label: "Status" },
        ]);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="payroll_${month || "all"}.csv"`);
        return res.send(csv);
      }
      res.json(enriched);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Advances ─────────────────────────────────────────────────────────────────
  app.get("/api/advances", requireAuth, async (req, res) => {
    try {
      const workerId = Number(req.query.worker_id);
      if (!workerId) return res.status(400).json({ error: "worker_id required" });
      const rows = await storage.getAdvances(workerId);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/advances", requireAuth, async (req, res) => {
    try {
      const data = insertAdvanceSchema.parse(req.body);
      const row = await storage.createAdvance(data);
      res.status(201).json(row);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ─── Subscriptions ─────────────────────────────────────────────────────────

  // Get current user's subscription
  app.get("/api/subscriptions/current", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const sub = await storage.getSubscription(userId);
      res.json(sub ?? { planCode: "free_trial", status: "trialing" });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Create Razorpay subscription checkout
  app.post("/api/subscriptions/razorpay/create", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { planId, planCode, billingInterval } = z.object({
        planId: z.string(),
        planCode: z.string(),
        billingInterval: z.enum(["monthly", "yearly"]),
      }).parse(req.body);

      const totalCount = billingInterval === "yearly" ? 12 : 12; // 12 billing cycles
      const razorpayRes = await createRazorpaySubscription({
        planId,
        totalCount,
        customerEmail: user.email,
        customerName: user.name,
        customerContact: user.mobile,
        notes: { userId: String(user.id), planCode, billingInterval },
      });

      // Save pending subscription
      await storage.upsertUserSubscription(user.id, {
        planCode: planCode as any,
        billingInterval: billingInterval as any,
        gateway: "razorpay",
        gatewaySubscriptionId: razorpayRes.id,
        status: "trialing",
      });

      res.json({ subscriptionId: razorpayRes.id, shortUrl: razorpayRes.short_url });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // Create Stripe Checkout Session
  app.post("/api/subscriptions/stripe/create", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { priceId, planCode, billingInterval } = z.object({
        priceId: z.string(),
        planCode: z.string(),
        billingInterval: z.enum(["monthly", "yearly"]),
      }).parse(req.body);

      const session = await createStripeCheckoutSession({
        priceId,
        userId: user.id,
        userEmail: user.email,
        planCode,
        billingInterval,
      });

      res.json({ sessionId: session.sessionId, url: session.url });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // Cancel subscription
  app.post("/api/subscriptions/cancel", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const sub = await storage.getSubscription(userId);
      if (!sub || !sub.gatewaySubscriptionId) {
        return res.status(404).json({ error: "No active subscription found" });
      }
      if (sub.gateway === "razorpay") {
        await cancelRazorpaySubscription(sub.gatewaySubscriptionId, true);
      } else if (sub.gateway === "stripe") {
        await cancelStripeSubscription(sub.gatewaySubscriptionId, false);
      }
      await storage.updateSubscription(sub.id, { cancelAtPeriodEnd: true });
      res.json({ message: "Subscription will cancel at end of billing period" });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ─── Razorpay Webhook ──────────────────────────────────────────────────────
  app.post("/api/webhooks/razorpay", async (req, res) => {
    const signature = req.headers["x-razorpay-signature"] as string;
    const rawBody = JSON.stringify(req.body);

    try {
      if (!verifyRazorpayWebhook(rawBody, signature)) {
        return res.status(400).json({ error: "Invalid signature" });
      }
    } catch {
      // If secret not set, skip verification in dev
      if (process.env.NODE_ENV === "production") {
        return res.status(400).json({ error: "Webhook secret not configured" });
      }
    }

    const event = req.body;
    const eventName: string = event.event;

    try {
      const subscriptionEntity = event.payload?.subscription?.entity;
      if (!subscriptionEntity) return res.json({ received: true });

      const gatewaySubId: string = subscriptionEntity.id;
      const sub = await storage.getSubscriptionByGatewayId(gatewaySubId);
      if (!sub) return res.json({ received: true }); // unknown subscription

      const periodStart = subscriptionEntity.current_start
        ? new Date(subscriptionEntity.current_start * 1000).toISOString()
        : undefined;
      const periodEnd = subscriptionEntity.current_end
        ? new Date(subscriptionEntity.current_end * 1000).toISOString()
        : undefined;

      if (eventName === "subscription.activated") {
        await storage.updateSubscription(sub.id, {
          status: "active",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        });
      } else if (eventName === "subscription.charged") {
        await storage.updateSubscription(sub.id, {
          status: "active",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        });
      } else if (eventName === "subscription.cancelled") {
        await storage.updateSubscription(sub.id, { status: "cancelled" });
      } else if (eventName === "subscription.completed") {
        await storage.updateSubscription(sub.id, { status: "expired" });
      } else if (eventName === "subscription.halted") {
        await storage.updateSubscription(sub.id, { status: "past_due" });
      }

      res.json({ received: true });
    } catch (e: any) {
      console.error("Razorpay webhook error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Stripe Webhook ────────────────────────────────────────────────────────
  app.post("/api/webhooks/stripe", async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;
    let stripeEvent: any;

    try {
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      stripeEvent = constructStripeEvent(rawBody, signature);
    } catch (e: any) {
      console.error("Stripe webhook signature error:", e.message);
      return res.status(400).json({ error: `Webhook error: ${e.message}` });
    }

    try {
      switch (stripeEvent.type) {
        case "checkout.session.completed": {
          const session = stripeEvent.data.object;
          const userId = parseInt(session.metadata?.userId || session.client_reference_id || "0");
          const planCode = session.metadata?.planCode || "starter";
          const billingInterval = session.metadata?.billingInterval || "monthly";
          const stripeSubId: string = session.subscription;

          if (userId) {
            await storage.upsertUserSubscription(userId, {
              planCode: planCode as any,
              billingInterval: billingInterval as any,
              gateway: "stripe",
              gatewaySubscriptionId: stripeSubId,
              gatewayCustomerId: session.customer,
              status: "active",
            });
          }
          break;
        }
        case "customer.subscription.updated": {
          const stripeSub = stripeEvent.data.object;
          const existing = await storage.getSubscriptionByGatewayId(stripeSub.id);
          if (existing) {
            const newStatus = stripeSub.status === "active" ? "active"
              : stripeSub.status === "trialing" ? "trialing"
                : stripeSub.status === "past_due" ? "past_due"
                  : stripeSub.status === "canceled" ? "cancelled"
                    : "expired";
            await storage.updateSubscription(existing.id, {
              status: newStatus as any,
              currentPeriodStart: new Date(stripeSub.current_period_start * 1000).toISOString(),
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000).toISOString(),
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            });
          }
          break;
        }
        case "customer.subscription.deleted": {
          const stripeSub = stripeEvent.data.object;
          const existing = await storage.getSubscriptionByGatewayId(stripeSub.id);
          if (existing) {
            await storage.updateSubscription(existing.id, { status: "cancelled" });
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (e: any) {
      console.error("Stripe webhook handler error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  return httpServer;
}
