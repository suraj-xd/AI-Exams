import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const SECRET_KEY = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
const INITIAL_CREDITS = 4;
const STORAGE_FILE = path.join(process.cwd(), '.credits-store.json');

interface UserData {
  id: string;
  credits: number;
  hasLocalApiKey: boolean;
  createdAt: number;
  lastAccessed: number;
  ipAddress: string;
  userAgent: string;
  fingerprint: string;
}

// In-memory store (in production, use Redis or database)
const userSessions = new Map<string, UserData>();

// Load stored data on startup
function loadStoredData() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      const storedSessions: Array<[string, UserData]> = JSON.parse(data);
      for (const [key, userData] of storedSessions) {
        userSessions.set(key, userData);
      }
      console.log(`Loaded ${userSessions.size} user sessions from storage`);
    }
  } catch (error) {
    console.error('Error loading stored data:', error);
  }
}

// Save data to file
function saveStoredData() {
  try {
    const dataToStore = Array.from(userSessions.entries());
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(dataToStore, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Initialize storage on first load
let isInitialized = false;
if (!isInitialized) {
  loadStoredData();
  isInitialized = true;
}

// Get client IP address
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  let ip: string = '127.0.0.1'; // Default fallback
  
  if (forwarded) {
    if (typeof forwarded === 'string') {
      const firstIp = forwarded.split(',')[0]?.trim();
      if (firstIp) ip = firstIp;
    } else if (Array.isArray(forwarded) && forwarded.length > 0 && forwarded[0]) {
      ip = forwarded[0];
    }
  } else {
    const remoteAddr = req.connection?.remoteAddress || req.socket?.remoteAddress;
    if (remoteAddr) ip = remoteAddr;
  }
  
  return ip.replace('::ffff:', ''); // Remove IPv6 prefix if present
}

// Create a unique fingerprint based on IP, User-Agent, and other headers
function createFingerprint(req: NextApiRequest): string {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Create a hash based on multiple factors
  const fingerprintData = `${ip}:${userAgent}:${acceptLanguage}:${acceptEncoding}`;
  return crypto.createHash('sha256').update(fingerprintData + SECRET_KEY).digest('hex');
}

// Get or create user session based on fingerprint
function getOrCreateUserSession(req: NextApiRequest): UserData {
  const fingerprint = createFingerprint(req);
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  
  // Check if user exists
  let existingUser = userSessions.get(fingerprint);
  
  // Also check by IP in case fingerprint changed slightly
  if (!existingUser) {
    for (const [key, userData] of userSessions.entries()) {
      if (userData.ipAddress === ip && 
          userData.userAgent === userAgent &&
          Date.now() - userData.lastAccessed < 24 * 60 * 60 * 1000) { // 24 hours
        // Update the fingerprint and return existing session
        userSessions.delete(key);
        userData.fingerprint = fingerprint;
        userData.lastAccessed = Date.now();
        userSessions.set(fingerprint, userData);
        return userData;
      }
    }
  }
  
  if (existingUser && Date.now() - existingUser.lastAccessed < 24 * 60 * 60 * 1000) {
    // Update last accessed time
    existingUser.lastAccessed = Date.now();
    userSessions.set(fingerprint, existingUser);
    return existingUser;
  }
  
  // Create new user session
  const userId = crypto.randomUUID();
  const newUser: UserData = {
    id: userId,
    credits: INITIAL_CREDITS,
    hasLocalApiKey: false,
    createdAt: Date.now(),
    lastAccessed: Date.now(),
    ipAddress: ip,
    userAgent: userAgent,
    fingerprint: fingerprint,
  };
  
  userSessions.set(fingerprint, newUser);
  saveStoredData(); // Persist new user session
  return newUser;
}

// Clean up old sessions (older than 24 hours)
function cleanupOldSessions() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [key, userData] of userSessions.entries()) {
    if (now - userData.lastAccessed > maxAge) {
      userSessions.delete(key);
    }
  }
}

interface CreditsResponse {
  success: boolean;
  data?: {
    credits: number;
    hasLocalApiKey: boolean;
    userId: string;
    fingerprint: string;
    debug?: {
      ip: string;
      userAgent: string;
      totalSessions: number;
    };
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreditsResponse>
) {
  try {
    // Cleanup old sessions periodically
    if (Math.random() < 0.1) { // 10% chance to cleanup on each request
      cleanupOldSessions();
    }
    
    const userSession = getOrCreateUserSession(req);
    const isDebug = process.env.NODE_ENV === 'development';
    
    switch (req.method) {
      case 'GET':
        // Get current credits
        return res.status(200).json({
          success: true,
          data: {
            credits: userSession.credits,
            hasLocalApiKey: userSession.hasLocalApiKey,
            userId: userSession.id,
            fingerprint: userSession.fingerprint.substring(0, 8) + '...', // Show partial for debugging
            ...(isDebug && {
              debug: {
                ip: userSession.ipAddress,
                userAgent: userSession.userAgent.substring(0, 50) + '...',
                totalSessions: userSessions.size,
              }
            })
          },
        });
        
      case 'POST':
        // Handle credit operations
        const { action, hasLocalApiKey } = req.body;
        
        switch (action) {
          case 'decrement':
            if (userSession.hasLocalApiKey) {
              // Don't decrement if using local API key
              return res.status(200).json({
                success: true,
                data: {
                  credits: userSession.credits,
                  hasLocalApiKey: userSession.hasLocalApiKey,
                  userId: userSession.id,
                  fingerprint: userSession.fingerprint.substring(0, 8) + '...',
                },
              });
            }
            
            if (userSession.credits <= 0) {
              return res.status(400).json({
                success: false,
                error: 'No credits remaining',
              });
            }
            
            userSession.credits -= 1;
            userSession.lastAccessed = Date.now();
            userSessions.set(userSession.fingerprint, userSession);
            saveStoredData(); // Persist the credit change
            
            return res.status(200).json({
              success: true,
              data: {
                credits: userSession.credits,
                hasLocalApiKey: userSession.hasLocalApiKey,
                userId: userSession.id,
                fingerprint: userSession.fingerprint.substring(0, 8) + '...',
              },
            });
            
          case 'setApiKeyStatus':
            userSession.hasLocalApiKey = hasLocalApiKey;
            userSession.lastAccessed = Date.now();
            userSessions.set(userSession.fingerprint, userSession);
            saveStoredData(); // Persist the API key status change
            
            return res.status(200).json({
              success: true,
              data: {
                credits: userSession.credits,
                hasLocalApiKey: userSession.hasLocalApiKey,
                userId: userSession.id,
                fingerprint: userSession.fingerprint.substring(0, 8) + '...',
              },
            });
            
          case 'reset':
            // Development only - remove in production
            if (process.env.NODE_ENV === 'development') {
              userSession.credits = INITIAL_CREDITS;
              userSession.lastAccessed = Date.now();
              userSessions.set(userSession.fingerprint, userSession);
              saveStoredData(); // Persist the reset
              
              return res.status(200).json({
                success: true,
                data: {
                  credits: userSession.credits,
                  hasLocalApiKey: userSession.hasLocalApiKey,
                  userId: userSession.id,
                  fingerprint: userSession.fingerprint.substring(0, 8) + '...',
                },
              });
            }
            
            return res.status(403).json({
              success: false,
              error: 'Reset not allowed in production',
            });
            
          default:
            return res.status(400).json({
              success: false,
              error: 'Invalid action',
            });
        }
        
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
        });
    }
  } catch (error) {
    console.error('Credits API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
} 