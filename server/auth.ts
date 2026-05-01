import crypto from "crypto";
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import ConnectSqlite3 from "connect-sqlite3";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { sendEmail } from "./email";
import type { User } from "@shared/schema";

// ─── Password hashing with Node built-in crypto ───────────────────────────────
const SCRYPT_PREFIX = "scrypt:";

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `${SCRYPT_PREFIX}${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (stored.startsWith(SCRYPT_PREFIX)) {
    const [, salt, hash] = stored.split(":");
    const derived = crypto.scryptSync(plain, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
  }
  // Legacy plaintext — direct compare (will be rehashed on next login)
  return plain === stored;
}

// ─── Migrate plaintext passwords on startup ────────────────────────────────────
export async function migratePlaintextPasswords() {
  const users = await storage.getUsers();
  for (const user of users) {
    if (!user.password.startsWith(SCRYPT_PREFIX)) {
      const hashed = hashPassword(user.password);
      await storage.updateUser(user.id, { password: hashed });
      console.log(`[auth] Rehashed password for user ${user.email}`);
    }
  }
}

// ─── Auth middleware ───────────────────────────────────────────────────────────
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// ─── Setup auth on Express app ─────────────────────────────────────────────────
export async function setupAuth(app: Express) {
  const SQLiteStore = ConnectSqlite3(session);
  const isProd = process.env.NODE_ENV === "production";

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "sitetrack-dev-secret-change-in-prod",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: isProd,          // send only over HTTPS in production
        sameSite: isProd ? "none" : "lax", // cross-site for prod behind CDN/proxy
      },
      store: new SQLiteStore({ db: "sessions.db", dir: ".", table: "sessions" }) as any,
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport local strategy
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) return done(null, false, { message: "Invalid email or password" });
        if (!user.active) return done(null, false, { message: "Account is disabled" });
        if (!verifyPassword(password, user.password)) {
          return done(null, false, { message: "Invalid email or password" });
        }
        // Re-hash plaintext password on successful login
        if (!user.password.startsWith(SCRYPT_PREFIX)) {
          await storage.updateUser(user.id, { password: hashPassword(password) });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user ?? false);
    } catch (err) {
      done(err);
    }
  });

  // ─── Auth routes ──────────────────────────────────────────────────────────────

  // POST /api/auth/login
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const { password, ...safeUser } = user;
        return res.json({ user: safeUser });
      });
    })(req, res, next);
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ success: true });
      });
    });
  });

  // POST /api/auth/register (self-serve signup — creates admin + free trial, with abuse guard)
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { name, companyName, email, mobile, password } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ error: "name, email, and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      // Check for duplicate email
      const existing = await storage.getUserByEmail(email.toLowerCase().trim());
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }

      // Normalize company name for abuse check
      const normalizedCompany = (companyName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      let hadTrialBefore = false;
      if (normalizedCompany.length >= 3) {
        const prior = await storage.getTrialRegistryByCompanyName(normalizedCompany);
        if (prior && (Date.now() - new Date(prior.createdAt).getTime()) < 90 * 24 * 60 * 60 * 1000) {
          hadTrialBefore = true;
        }
      }

      // Create the user as admin
      const user = await storage.createUser({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        mobile: mobile?.trim() || null,
        password: hashPassword(password),
        role: "admin",
        active: true,
      });

      if (hadTrialBefore) {
        // Record this signup but do NOT give a free trial — force payment
        await storage.createTrialRegistry({
          email: user.email,
          companyNameNormalized: normalizedCompany,
          ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || null,
        });
        req.logIn(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          const { password: _pw, ...safeUser } = user;
          return res.status(201).json({ user: safeUser, trialEndsAt: null, requiresPayment: true, message: "This company has already used a free trial. Please subscribe to continue." });
        });
        return;
      }

      // Create a 14-day free_trial subscription
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      await storage.upsertUserSubscription(user.id, {
        planCode: "free_trial",
        billingInterval: "monthly",
        gateway: null,
        gatewaySubscriptionId: null,
        status: "trialing",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: trialEnd.toISOString(),
        cancelAtPeriodEnd: false,
      });

      // Record trial usage for abuse prevention
      await storage.createTrialRegistry({
        email: user.email,
        companyNameNormalized: normalizedCompany,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || null,
      });

      // Auto-login the new user
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const { password: _pw, ...safeUser } = user;
        return res.status(201).json({ user: safeUser, trialEndsAt: trialEnd.toISOString() });
      });

    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/auth/me
  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = req.user as User;
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  // POST /api/auth/forgot-password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "A valid email address is required" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      // Always return success — don't reveal whether email exists
      if (!user) {
        return res.json({ success: true, message: "If this email is registered, you will receive reset instructions shortly." });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2); // 2-hour expiry

      await storage.createPasswordReset({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
      });

      const appUrl = process.env.APP_URL || "https://sitetrack.site";
      const resetUrl = `${appUrl}/#/reset-password?token=${token}`;

      await sendEmail({
        to: user.email,
        subject: "Reset your SiteTrack password",
        text: `You requested a password reset for your SiteTrack account.\n\nClick the link below to set a new password (expires in 2 hours):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
        html: `<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#f97316;margin-bottom:8px">SiteTrack</h2>
          <p style="color:#444;line-height:1.5">You requested a password reset. Click the button below to set a new password. This link expires in <strong>2 hours</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;margin:16px 0;font-weight:600">Reset Password</a>
          <p style="color:#888;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email. The link will expire automatically.</p>
        </div>`,
      });

      res.json({ success: true, message: "If this email is registered, you will receive reset instructions shortly." });
    } catch (e: any) {
      console.error("Forgot password error:", e);
      res.status(500).json({ error: "Unable to process request. Please try again later." });
    }
  });

  // POST /api/auth/reset-password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ error: "token and newPassword are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const reset = await storage.getPasswordResetByToken(token);
      if (!reset || reset.used || new Date(reset.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
      }

      await storage.updateUser(reset.userId, { password: hashPassword(newPassword) });
      await storage.markPasswordResetUsed(reset.id);

      res.json({ success: true, message: "Password updated successfully. You can now log in with your new password." });
    } catch (e: any) {
      console.error("Reset password error:", e);
      res.status(500).json({ error: "Unable to reset password. Please try again later." });
    }
  });

  // POST /api/auth/change-password
  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "currentPassword and newPassword are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
      }
      if (!verifyPassword(currentPassword, user.password)) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      await storage.updateUser(user.id, { password: hashPassword(newPassword) });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Migrate plaintext passwords in background
  migratePlaintextPasswords().catch(console.error);
}
