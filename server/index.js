// --- SterlingPay Pro Server ---
// Added Peer-to-Peer (P2P) Transfer Feature

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

app.post('/api/exchange', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const { fromCurrency, toCurrency, fromAmount } = req.body;
    const exchangeRates = { 'GBP_USD': 1.25, 'USD_GBP': 0.80, 'GBP_EUR': 1.18, 'EUR_GBP': 0.85, 'USD_EUR': 0.94, 'EUR_USD': 1.06 };
    const rate = exchangeRates[`${fromCurrency}_${toCurrency}`];
    if (!rate) return res.status(400).json({ error: "Currency exchange not supported." });
    const toAmount = fromAmount * rate;
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const checkBalanceSql = `SELECT balance FROM wallets WHERE user_id = ? AND currency = ?`;
        db.get(checkBalanceSql, [userId, fromCurrency], (err, fromWallet) => {
            if (err || !fromWallet || fromWallet.balance < fromAmount) {
                db.run("ROLLBACK");
                return res.status(400).json({ error: "Insufficient funds." });
            }
            const updateFromSql = `UPDATE wallets SET balance = balance - ? WHERE user_id = ? AND currency = ?`;
            db.run(updateFromSql, [fromAmount, userId, fromCurrency]);
            const updateToSql = `UPDATE wallets SET balance = balance + ? WHERE user_id = ? AND currency = ?`;
            db.run(updateToSql, [toAmount, userId, toCurrency]);
            const logSql = `INSERT INTO transactions (user_id, type, amount, currency, details) VALUES (?, ?, ?, ?, ?)`;
            const details = `Exchanged ${fromAmount} ${fromCurrency} to ${toAmount.toFixed(2)} ${toCurrency}`;
            db.run(logSql, [userId, 'exchange', fromAmount, fromCurrency, details]);
            db.run("COMMIT", (err) => {
                if (err) return res.status(500).json({ error: "Transaction failed." });
                res.json({ success: true, message: "Exchange successful." });
            });
        });
    });
});

// --- !! NEW P2P TRANSFER ROUTE !! ---
app.post('/api/transfer', authMiddleware, (req, res) => {
    const senderId = req.user.id;
    const { recipientEmail, amount, currency } = req.body;

    // Find the recipient user by their email
    const findRecipientSql = `SELECT * FROM users WHERE email = ?`;
    db.get(findRecipientSql, [recipientEmail], (err, recipient) => {
        if (err) return res.status(500).json({ error: "Server error finding recipient." });
        if (!recipient) return res.status(404).json({ error: "Recipient not found." });
        if (recipient.id === senderId) return res.status(400).json({ error: "You cannot send money to yourself." });

        const recipientId = recipient.id;

        // Perform the transfer within a secure database transaction
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            // 1. Check sender's balance
            const checkBalanceSql = `SELECT balance FROM wallets WHERE user_id = ? AND currency = ?`;
            db.get(checkBalanceSql, [senderId, currency], (err, senderWallet) => {
                if (err || !senderWallet || senderWallet.balance < amount) {
                    db.run("ROLLBACK");
                    return res.status(400).json({ error: "Insufficient funds." });
                }

                // 2. Subtract from sender
                const subtractSql = `UPDATE wallets SET balance = balance - ? WHERE user_id = ? AND currency = ?`;
                db.run(subtractSql, [amount, senderId, currency]);

                // 3. Add to recipient
                const addSql = `UPDATE wallets SET balance = balance + ? WHERE user_id = ? AND currency = ?`;
                db.run(addSql, [amount, recipientId, currency]);

                // 4. Log transaction for sender
                const logSenderSql = `INSERT INTO transactions (user_id, type, amount, currency, details) VALUES (?, ?, ?, ?, ?)`;
                const senderDetails = `Sent to ${recipient.full_name} (${recipientEmail})`;
                db.run(logSenderSql, [senderId, 'sent', -amount, currency, senderDetails]);
                
                // 5. Log transaction for recipient
                const logRecipientSql = `INSERT INTO transactions (user_id, type, amount, currency, details) VALUES (?, ?, ?, ?, ?)`;
                const recipientDetails = `Received from ${req.user.email}`; // Assuming email is on req.user
                db.run(logRecipientSql, [recipientId, 'received', amount, currency, recipientDetails]);


                db.run("COMMIT", (err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ error: "Transfer failed." });
                    }
                    res.json({ success: true, message: `Successfully sent ${amount} ${currency} to ${recipientEmail}` });
                });
            });
        });
    });
});


// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
