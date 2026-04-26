const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');

const localDb = new Database('data.db');
const remoteClient = createClient({
  url: 'libsql://sitetrack-db-pdalpha.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzcxOTI5NTEsImlkIjoiMDE5ZGM4ZjMtYmMwMS03ODI2LTgwNDctYjE0ZTY0MzA0YTAxIiwicmlkIjoiZjE1M2VkY2YtMDBmYi00N2EzLTg1MjAtMDk5ZmY5MTAyMWQ3In0.jML5_rbCU6wUFVBGuZxleldu_i5kxFabJy1homI1Hws289tMHv5R3TbkRDl2FyiIBGNMnCTDQpyoAfP3ivjFBQ',
});

async function migrateTable(tableName) {
  console.log(`Migrating ${tableName}...`);
  let rows;
  try {
     rows = localDb.prepare(`SELECT * FROM ${tableName}`).all();
  } catch (e) {
    console.log(`Table ${tableName} does not exist in local DB.`);
    return;
  }

  if (rows.length === 0) {
    console.log(`No data in ${tableName}.`);
    return;
  }

  // Get columns from the first row
  const cols = Object.keys(rows[0]);
  const placeholders = cols.map(() => '?').join(', ');
  const insertSql = `INSERT OR REPLACE INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`;

  for (const row of rows) {
    const values = Object.values(row);
    await remoteClient.execute({
      sql: insertSql,
      args: values
    });
  }
  console.log(`Successfully migrated ${rows.length} rows to ${tableName}.`);
}

async function run() {
  try {
    // Drop existing tables on Turso to ensure fresh schema match
    console.log('Cleaning up Turso tables for a fresh sync...');
    const tables = [
      'users', 
      'sites', 
      'contractors', 
      'workers', 
      'attendance', 
      'dpr', 
      'expenses', 
      'payroll', 
      'advances'
    ];
    
    // Create tables exactly matching schema.ts
    console.log('Creating tables on Turso...');
    await remoteClient.executeMultiple(`
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS sites;
      DROP TABLE IF EXISTS contractors;
      DROP TABLE IF EXISTS workers;
      DROP TABLE IF EXISTS attendance;
      DROP TABLE IF EXISTS dpr;
      DROP TABLE IF EXISTS expenses;
      DROP TABLE IF EXISTS payroll;
      DROP TABLE IF EXISTS advances;

      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mobile TEXT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        site_id INTEGER,
        active INTEGER NOT NULL DEFAULT 1,
        preferred_language TEXT NOT NULL DEFAULT 'en',
        created_at TEXT NOT NULL
      );

      CREATE TABLE sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        client_name TEXT NOT NULL,
        location TEXT,
        start_date TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_by INTEGER,
        created_at TEXT NOT NULL
      );

      CREATE TABLE contractors (
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

      CREATE TABLE workers (
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

      CREATE TABLE attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id INTEGER NOT NULL,
        worker_id INTEGER,
        worker_name TEXT NOT NULL,
        contractor_name TEXT,
        check_in TEXT,
        check_out TEXT,
        status TEXT NOT NULL DEFAULT 'present',
        date TEXT NOT NULL,
        created_by INTEGER,
        created_at TEXT NOT NULL
      );

      CREATE TABLE dpr (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        work_done TEXT NOT NULL,
        manpower_count INTEGER,
        contractor_name TEXT,
        material_used TEXT,
        machinery_used TEXT,
        delay_reason TEXT,
        remarks TEXT,
        photos TEXT,
        submitted_by INTEGER,
        created_at TEXT NOT NULL
      );

      CREATE TABLE expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        vendor_name TEXT,
        payment_mode TEXT NOT NULL DEFAULT 'cash',
        bill_photo TEXT,
        notes TEXT,
        expense_date TEXT NOT NULL,
        added_by INTEGER,
        created_at TEXT NOT NULL
      );

      CREATE TABLE payroll (
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

      CREATE TABLE advances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL
      );
    `);
    console.log('Tables created on Turso.');

    for (const table of tables) {
      await migrateTable(table);
    }
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    localDb.close();
  }
}

run();
