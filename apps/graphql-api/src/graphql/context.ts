// noda_turbo/apps/graphql-api/src/graphql/context.ts
import pool from './db';
import { Request } from 'express';
import * as jose from 'jose';

// --- SETUP ---
const CLIENT_ID = process.env.AUTH_MICROSOFT_ENTRA_ID_ID;

if (!CLIENT_ID) {
  throw new Error("CRITICAL: Missing Azure AD environment variable: AUTH_MICROSOFT_ENTRA_ID_ID");
}

// Use the 'common' endpoint for JWKS to support all account types.
const jwksUri = `https://login.microsoftonline.com/common/discovery/v2.0/keys`;
const JWKS = jose.createRemoteJWKSet(new URL(jwksUri));

// --- INTERFACES ---
export interface UserPayload {
  oid: string;
  preferred_username?: string;
  name?: string;
  roles?: string[];
  tid: string;
}

export interface MyContext {
  db: typeof pool;
  user?: UserPayload;
}

// --- CONTEXT FACTORY ---
export const createContext = async ({ req }: { req: Request }): Promise<MyContext> => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return { db: pool };
  }

  const token = authHeader.substring(7);

  try {
    // The audience check is the most important validation here.
    const { payload } = await jose.jwtVerify(token, JWKS, {
      audience: CLIENT_ID,
    });

    const userOid = payload.oid as string;

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userOid]);
    let userInDb = userResult.rows[0];

    if (!userInDb) {
      console.log(`User with OID ${userOid} not found. Creating new user...`);
      const userFullName = payload.name || payload.preferred_username;
      
      // Re-added the 'name' column to the INSERT statement to match the updated DB schema.
      const newUserResult = await pool.query(
        'INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
        [userOid, userFullName, payload.preferred_username, 'SSO_USER']
      );
      userInDb = newUserResult.rows[0];
    }
    
    return { db: pool, user: userInDb };

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in createContext:', error.message);
    } else {
      console.error('An unknown error occurred in createContext.');
    }
    return { db: pool };
  }
};