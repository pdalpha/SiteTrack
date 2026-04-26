import crypto from "crypto";
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
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
  const MStore = MemoryStore(session);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "sitetrack-dev-secret-change-in-prod",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        sameSite: "lax",
      },
      store: new MStore({ checkPeriod: 86_400_000 }), // prune expired entries daily
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

  // GET /api/auth/me
  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = req.user as User;
    const { password, ...safeUser } = user;
    res.json(safeUser);
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
