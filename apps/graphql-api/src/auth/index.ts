import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../graphql/db';

const router: Router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key-for-dev';
const SALT_ROUNDS = 10;

router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  
  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const newUserResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role, created_at',
      [email, hashedPassword]
    );
    
    const newUser = newUserResult.rows[0];
    console.log(`User registered successfully: ${newUser.email}`);
    res.status(201).json({ id: newUser.id, email: newUser.email, role: newUser.role, createdAt: newUser.created_at });
    
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const passwordIsValid = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordIsValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log(`User logged in successfully: ${user.email}`);
    res.json({ token });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

export default router;