// --- SterlingPay Pro Server ---
// Added Profile Management Feature

// 1. Import required packages
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 2. Initialize the Express App
const app = express();
const PORT = process.env.PORT || 5000; 

// A secret for our digital keys.
const JWT_SECRET = 'a-super-secret-key-for-sterling-pay-pro';

// 3. Setup the Local Database
const db = new sqlite3.Database('./sterlingpay.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the local SQLite database.');
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          two_fa_secret TEXT,
          two_fa_enabled BOOLEAN DEFAULT FALSE
        )`);
        db.run("ALTER TABLE users ADD COLUMN two_fa_secret TEXT", () => {});
        db.run("ALTER TABLE users ADD COLUMN two_fa_enabled BOOLEAN DEFAULT FALSE", () => {});
        
        db.run(`CREATE TABLE IF NOT EXISTS wallets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            currency TEXT NOT NULL,
            balance REAL NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
        db.run("ALTER TABLE transactions ADD COLUMN type TEXT NOT NULL DEFAULT 'transfer'", () => {});

        db.run(`CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            client_name TEXT NOT NULL,
            client_email TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL,
            due_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
    });
  }
});


// 4. Middleware (App's Helpers)
app.use(cors());
app.use(express.json());


// 5. Security Middleware (The "Bouncer")
const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. Malformed token.' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid.' });
  }
};


// --- API Routes ---

// Public Routes
app.post('/api/register', async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ error: 'Please provide all required fields.' });
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const sql = `INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)`;
    db.run(sql, [fullName, email, hashedPassword], function(err) {
      if (err) return res.status(500).json({ error: 'Could not register user. The email might already be in use.' });
      const newUserId = this.lastID;
      const currencies = ['GBP', 'USD', 'EUR'];
      const walletSql = `INSERT INTO wallets (user_id, currency, balance) VALUES (?, ?, ?)`;
      currencies.forEach(currency => {
          const startingBalance = currency === 'GBP' ? 10000 : currency === 'USD' ? 5000 : 2500;
          db.run(walletSql, [newUserId, currency, startingBalance]);
      });
      res.status(201).json({ id: newUserId, email: email, fullName: fullName });
    });
  } catch (error) {
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Please provide email and password.' });
  const sql = `SELECT * FROM users WHERE email = ?`;
  db.get(sql, [email], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Invalid credentials.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });
    const payload = { user: { id: user.id, email: user.email } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  });
});

// Protected Routes
app.get('/api/wallets', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const sql = `SELECT currency, balance FROM wallets WHERE user_id = ?`;
    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Could not retrieve wallets.' });
        res.json(rows);
    });
});

// --- !! NEW PROFILE MANAGEMENT ROUTES !! ---

// Get current user's profile info (Protected)
app.get('/api/profile', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const sql = `SELECT id, full_name, email FROM users WHERE id = ?`;

    db.get(sql, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Could not retrieve profile." });
        }
        if (!row) {
            return res.status(404).json({ error: "User profile not found." });
        }
        res.json(row);
    });
});

// Update current user's profile info (Protected)
app.put('/api/profile', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const { fullName } = req.body;

    if (!fullName) {
        return res.status(400).json({ error: "Full name is required." });
    }

    const sql = `UPDATE users SET full_name = ? WHERE id = ?`;
    db.run(sql, [fullName, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: "Could not update profile." });
        }
        res.json({ success: true, message: "Profile updated successfully." });
    });
});
// --- END NEW ROUTES ---


// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
