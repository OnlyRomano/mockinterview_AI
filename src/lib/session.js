import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

/**
 * @typedef {Object} SessionData
 * @property {string} [userId]
 * @property {string} [email]
 * @property {string} [name]
 * @property {boolean} isLoggedIn
 */

const sessionOptions = {
  password: process.env.SESSION_PASSWORD,
  cookieName: 'HireReady',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession(cookieStore, sessionOptions);
  
  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }
  
  return session;
}

export async function saveSession(session) {
  const currentSession = await getSession();
  Object.assign(currentSession, session);
  await currentSession.save();
}

export async function clearSession() {
  const session = await getSession();
  session.destroy();
}
