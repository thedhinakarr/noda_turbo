// =================================================================
// FILE: apps/graphql-api/src/graphql/context.ts
// (Updated with real JWT decoding)
// =================================================================
import pool from './db';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

export interface UserPayload {
  userId: string;
  role: string;
}

export interface MyContext {
  db: typeof pool;
  user?: UserPayload;
}

export const createContext = async ({ req }: { req: Request }): Promise<MyContext> => {
  const authHeader = req.headers.authorization || '';
  
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7, authHeader.length);
    try {
      const user = jwt.verify(token, JWT_SECRET) as UserPayload;
      return { db: pool, user };
    } catch (error) {
      console.log('Invalid or expired token');
    }
  }
  
  return { db: pool }; // Context for unauthenticated users
};