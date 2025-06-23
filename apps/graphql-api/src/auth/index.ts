// =================================================================
// FILE: apps/graphql-api/src/auth/index.ts
// (Updated with real JWT and password hashing logic)
// =================================================================
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../graphql/db'; // Reuse the database pool

const router: Router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

// --- User Registration ---
router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // In a real app, you would save the user to the database:
    // const newUser = await pool.query(
    //   'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    //   [email, hashedPassword]
    // );
    
    console.log(`User registered: ${email}, Hashed Password: ${hashedPassword}`);
    res.status(201).json({ message: 'User registered successfully.' });
    
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- User Login ---
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // In a real app, you'd fetch the user from the DB
    // const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    // const user = userResult.rows[0];
    
    // For now, we'll use a dummy user for testing
    const dummyUser = { email, passwordHash: await bcrypt.hash('password123', 10), id: 'user-123', role: 'admin' };
    
    if (!dummyUser) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const passwordIsValid = await bcrypt.compare(password, dummyUser.passwordHash);
    
    if (!passwordIsValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    // Generate JWT
    const token = jwt.sign({ userId: dummyUser.id, role: dummyUser.role }, JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ token });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;