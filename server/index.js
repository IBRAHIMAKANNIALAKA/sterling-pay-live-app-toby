// --- SterlingPay Pro Server ---
// This version uses a local SQLite database and is ready for deployment.

// 1. Import required packages
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 2. Initialize the Express App
const app = express();
// Render will set its own PORT, so we read it from the environment variables.
const PORT = process.env.PORT || 5000; 

// A secret for our digital keys.
const JWT_SECRET = 'a-super-secret-key-for-sterling-pay-pro';

// 3. Setup the Local Database
// This will create a file named "sterlingpay.db" in your server folder
const db = new sqlite3.Database('./sterlingpay.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the local SQLite database.');
    // Create the users table if it doesn't exist already
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )`);
  }
});


// 4. Middleware (App's Helpers)
app.use(cors());
app.use(express.json());

// --- API Routes ---

// Test Route
app.get('/', (req, res) => {
  res.send('Welcome to the SterlingPay Pro API!');
});

// User Registration Route
app.post('/api/register', async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  try {
    // Scramble the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const sql = `INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)`;
    
    db.run(sql, [fullName, email, hashedPassword], function(err) {
      if (err) {
        console.error('DATABASE ERROR:', err.message);
        return res.status(500).json({ error: 'Could not register user. The email might already be in use.' });
      }
      res.status(201).json({ id: this.lastID, email: email, fullName: fullName });
    });

  } catch (error) {
    console.error('SERVER ERROR:', error);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
});

// User Login Route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  const sql = `SELECT * FROM users WHERE email = ?`;

  db.get(sql, [email], async (err, user) => {
    if (err) {
      console.error('DATABASE ERROR:', err.message);
      return res.status(500).json({ error: 'Server error.' });
    }
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const payload = { user: { id: user.id, email: user.email } };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  });
});


// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
