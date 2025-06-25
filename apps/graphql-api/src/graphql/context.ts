// =================================================================
// FILE: apps/graphql-api/src/graphql/context.ts
// (Updated with diagnostic logging to debug the token issue)
// =================================================================
import pool from './db';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key-for-dev';

export interface UserPayload {
  userId: string;
  role: string;
}

export interface MyContext {
  db: typeof pool;
  user?: UserPayload;
}

export const createContext = async ({ req }: { req: Request }): Promise<MyContext> => {
  // --- DIAGNOSTIC LOGGING ---
  console.log('--- Creating context for new request ---');
  console.log('Request Headers:', req.headers);
  
  const authHeader = req.headers.authorization || '';
  console.log('Found Authorization Header:', authHeader);
  
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7, authHeader.length);
    console.log('Extracted Token:', token);
    
    try {
      const user = jwt.verify(token, JWT_SECRET) as UserPayload;
      console.log('Token verified successfully. User:', user);
      return { db: pool, user };
    } catch (error) {
      console.error('Token verification failed:', error);
    }
  } else {
    console.log('No Bearer token found in header.');
  }
  
  console.log('--- No user authenticated. Returning public context. ---');
  return { db: pool }; // Context for unauthenticated users
};