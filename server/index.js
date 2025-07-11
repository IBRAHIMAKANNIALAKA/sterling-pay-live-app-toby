// --- SterlingPay Pro Server ---
// Phase 4: Adding Two-Factor Authentication (2FA) Verify

// 1. Import required packages
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');

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
            sender_id INTEGER NOT NULL,
            recipient_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (recipient_id) REFERENCES users (id)
        )`);
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

// Test Route (Public)
app.get('/', (req, res) => {
  res.send('Welcome to the SterlingPay Pro API!');
});

// User Registration Route (Public)
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
          const startingBalance = currency === 'GBP' ? 1000 : currency === 'USD' ? 500 : 250;
          db.run(walletSql, [newUserId, currency, startingBalance]);
      });
      res.status(201).json({ id: newUserId, email: email, fullName: fullName });
    });
  } catch (error) {
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
});

// User Login Route (Public)
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

// Get Wallets Route (Protected)
app.get('/api/wallets', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const sql = `SELECT currency, balance FROM wallets WHERE user_id = ?`;
    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Could not retrieve wallets.' });
        res.json(rows);
    });
});

// Invoicing Routes (Protected)
app.post('/api/invoices', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const { clientName, clientEmail, amount, currency, dueDate } = req.body;
    if (!clientName || !clientEmail || !amount || !currency || !dueDate) return res.status(400).json({ error: 'Please provide all required fields for the invoice.' });
    const sql = `INSERT INTO invoices (user_id, client_name, client_email, amount, currency, due_date) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [userId, clientName, clientEmail, amount, currency, dueDate], function(err) {
        if (err) return res.status(500).json({ error: 'Could not create invoice.' });
        res.status(201).json({ id: this.lastID, message: 'Invoice created successfully.' });
    });
});
app.get('/api/invoices', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const sql = `SELECT id, client_name, amount, currency, due_date, status FROM invoices WHERE user_id = ? ORDER BY created_at DESC`;
    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Could not retrieve invoices.' });
        res.json(rows);
    });
});

// --- 2FA ROUTES ---

// Generate a 2FA secret and QR code for the user (Protected)
app.post('/api/2fa/generate', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(userEmail, 'SterlingPay', secret);
    const sql = `UPDATE users SET two_fa_secret = ? WHERE id = ?`;
    db.run(sql, [secret, userId], async function(err) {
        if (err) return res.status(500).json({ error: "Could not save 2FA secret." });
        try {
            const qrCodeImage = await qrcode.toDataURL(otpauth);
            res.json({ qrCode: qrCodeImage, secret });
        } catch (qrErr) {
            res.status(500).json({ error: "Could not generate QR code." });
        }
    });
});

// --- !! NEW 2FA VERIFY ROUTE !! ---
// Verify a 2FA token and enable 2FA for the user (Protected)
app.post('/api/2fa/verify', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const { token } = req.body; // The 6-digit code from the user's app

    if (!token) {
        return res.status(400).json({ error: "Token is required." });
    }

    const sqlGetSecret = `SELECT two_fa_secret FROM users WHERE id = ?`;
    db.get(sqlGetSecret, [userId], (err, user) => {
        if (err || !user || !user.two_fa_secret) {
            return res.status(500).json({ error: "Could not find 2FA secret. Please generate a new QR code." });
        }

        const secret = user.two_fa_secret;
        // Check if the token is valid
        const isValid = authenticator.verify({ token, secret });

        if (isValid) {
            // If valid, officially enable 2FA for the user
            const sqlEnable2FA = `UPDATE users SET two_fa_enabled = TRUE WHERE id = ?`;
            db.run(sqlEnable2FA, [userId], (err) => {
                if (err) {
                    return res.status(500).json({ error: "Could not enable 2FA." });
                }
                res.json({ verified: true, message: "2FA enabled successfully!" });
            });
        } else {
            // If not valid, send an error
            res.status(400).json({ verified: false, error: "Invalid token." });
        }
    });
});


// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
