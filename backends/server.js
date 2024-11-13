const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();

dotenv.config();

// Initialize app and configure port
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// SQLite Database connection
const db = new sqlite3.Database('./todoApp.db', (err) => {
    if (err) {
        console.error("Error connecting to SQLite database", err.message);
    } else {
        console.log("Connected to SQLite database");
    }
});

// Create Users table
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL
    )
`);

// Create Todos table
db.run(`
    CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        task TEXT NOT NULL,
        status TEXT CHECK(status IN ('done', 'pending', 'in progress', 'completed')) DEFAULT 'pending',
        userId TEXT NOT NULL,
        FOREIGN KEY(userId) REFERENCES users(id)
    )
`);

// Middleware to authenticate using JWT token
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.userId = decoded.id;  // Attach user ID from the token
        next();
    });
};

// **User Registration (POST)**
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;

    // Check if user already exists
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
        if (err) return res.status(500).json({ error: 'Server error' });

        if (row) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const userId = uuidv4();
        db.run("INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)",
            [userId, email, hashedPassword, name],
            (err) => {
                if (err) return res.status(500).json({ error: 'Server error' });
                res.status(201).json({ message: 'User created successfully' });
            });
    });
});

// **User Login (POST)**
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token });
    });
});

// **Profile Update (PUT)**
app.put('/api/profile', authenticate, async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const sql = "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?";
    db.run(sql, [name, email, hashedPassword, req.userId], function (err) {
        if (err) return res.status(500).json({ error: 'Error updating profile' });
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'Profile updated successfully' });
    });
});

// **Get Profile (GET)**
app.get('/api/profile', authenticate, (req, res) => {
    db.get("SELECT id, email, name FROM users WHERE id = ?", [req.userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Error fetching profile' });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    });
});

// **CRUD Operations for Todos**

app.get('/api/todos', authenticate, (req, res) => {
    db.all("SELECT * FROM todos WHERE userId = ?", [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch todos' });
        res.json(rows);
    });
});

app.post('/api/todos', authenticate, (req, res) => {
    const { task, status } = req.body;
    const todoId = uuidv4();

    const sql = "INSERT INTO todos (id, task, status, userId) VALUES (?, ?, ?, ?)";
    db.run(sql, [todoId, task, status, req.userId], function (err) {
        if (err) return res.status(400).json({ error: 'Failed to add todo' });
        res.status(201).json({ id: todoId, task, status, userId: req.userId });
    });
});

app.put('/api/todos/:id', authenticate, (req, res) => {
    const { task, status } = req.body;
    const sql = "UPDATE todos SET task = ?, status = ? WHERE id = ? AND userId = ?";

    db.run(sql, [task, status, req.params.id, req.userId], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update todo' });
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Todo not found or unauthorized' });
        }
        res.json({ message: 'Todo updated successfully' });
    });
});

app.delete('/api/todos/:id', authenticate, (req, res) => {
    const sql = "DELETE FROM todos WHERE id = ? AND userId = ?";

    db.run(sql, [req.params.id, req.userId], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to delete todo' });
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Todo not found or unauthorized' });
        }
        res.json({ message: 'Todo deleted successfully' });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
