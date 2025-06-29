// apps/graphql-api/src/graphql/context.ts
import pool from './db';
import { Request } from 'express';
import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const AZURE_AD_CLIENT_ID = process.env.AUTH_AZURE_AD_CLIENT_ID;
const jwksUri = `https://login.microsoftonline.com/common/discovery/v2.0/keys`;

const client = jwksClient({
  jwksUri: jwksUri,
});

function getSigningKey(header: JwtHeader, callback: SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error("Token is missing 'kid' in the header."));
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error("Error getting signing key:", err);
      return callback(err);
    }
    if (!key) {
        return callback(new Error("Signing key not found."));
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export interface UserPayload {
  oid: string; 
  email?: string; // Email can sometimes be optional
  name: string;
  roles?: string[];
  tid: string; 
}

export interface MyContext {
  db: typeof pool;
  user?: UserPayload;
}

export const createContext = async ({ req }: { req: Request }): Promise<MyContext> => {
  console.log('--- Creating context for new request ---');
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    console.log('No Bearer token found in header. Returning public context.');
    return { db: pool };
  }

  const token = authHeader.substring(7);

  const unverifiedDecodedToken = jwt.decode(token, { complete: true });
  console.log('--- Unverified Token Content (for debugging) ---');
  console.log('Header:', unverifiedDecodedToken?.header);
  console.log('Payload:', unverifiedDecodedToken?.payload);
  console.log('------------------------------------------------');

  try {
    const decodedToken = await new Promise<UserPayload>((resolve, reject) => {
      jwt.verify(
        token,
        getSigningKey,
        {
          audience: AZURE_AD_CLIENT_ID, 
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) {
            return reject(err);
          }
          resolve(decoded as UserPayload);
        }
      );
    });

    console.log(`Token verified successfully. User OID: ${decodedToken.oid} from Tenant ID: ${decodedToken.tid}`);

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decodedToken.oid]);
    let userInDb = userResult.rows[0];

    if (!userInDb) {
      console.log(`User with OID ${decodedToken.oid} not found in local DB. Creating new user...`);
      
      // ========================= THE FIX =========================
      // The original migration does not have a 'full_name' column, but it does have
      // 'email' and requires a 'password_hash'. We will insert the user's email
      // and a placeholder for the password_hash, since it's no longer used for login.
      // NOTE: The 'id' column in your migration is a UUID, but the 'oid' from the token is also a UUID,
      // so we can use it directly as the primary key.
      const newUserResult = await pool.query(
        'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
        [decodedToken.oid, decodedToken.email || decodedToken.name, 'SSO_USER']
      );
      // =========================================================

      userInDb = newUserResult.rows[0];
      console.log(`New user created: ${userInDb.email}`);
    } else {
        console.log(`User found in local DB: ${userInDb.email}`);
    }

    return { db: pool, user: decodedToken };

  } catch (error) {
    if (error instanceof Error) {
        console.error('Token verification failed:', error.message);
    } else {
        console.error('An unknown error occurred during token verification.');
    }
    return { db: pool }; 
  }
};