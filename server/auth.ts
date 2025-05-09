import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { log } from './vite';

// Aseguramos que el tipo User de Express incluya nuestro User
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      password?: string;
      email?: string | null;
      [key: string]: any;
    }
  }
}

const scryptAsync = promisify(scrypt);

// Función para hashear contraseñas
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Función para comparar contraseñas
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'calendar-ai-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // Una semana
      httpOnly: true,
      sameSite: 'strict'
    }
  };

  log('Setting up authentication middleware...');
  
  // Configure express session
  app.use(session(sessionSettings));
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        log(`Authenticating user: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          log(`Authentication failed: User ${username} not found`);
          return done(null, false, { message: "User not found" });
        }
        
        const isValidPassword = await comparePasswords(password, user.password);
        
        if (!isValidPassword) {
          log(`Authentication failed: Invalid password for ${username}`);
          return done(null, false, { message: "Invalid password" });
        }
        
        log(`Authentication successful for ${username}`);
        return done(null, user);
      } catch (error) {
        log(`Authentication error: ${error}`);
        return done(error);
      }
    }),
  );

  // Configure passport serialization
  passport.serializeUser((user, done) => {
    log(`Serializing user: ${user.id}`);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      log(`Deserializing user: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        log(`Deserialization failed: User ${id} not found`);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      log(`Deserialization error: ${error}`);
      done(error, null);
    }
  });

  // Authentication routes
  
  // Registration endpoint
  app.post("/api/auth/signup", async (req, res) => {
    try {
      log(`Registration attempt for: ${req.body.username}`);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        log(`Registration failed: Username ${req.body.username} already exists`);
        return res.status(400).json({
          success: false,
          message: "Username already exists"
        });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create user with hashed password
      const newUser = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      
      log(`User registered successfully: ${newUser.id} (${newUser.username})`);
      
      // Auto-login after registration
      req.login(newUser, (err) => {
        if (err) {
          log(`Auto-login failed after registration: ${err}`);
          return res.status(500).json({
            success: false,
            message: "Error during authentication after registration"
          });
        }
        
        // Send user info without password
        const { password, ...userWithoutPassword } = newUser;
        return res.status(201).json({
          success: true,
          user: userWithoutPassword
        });
      });
    } catch (error) {
      log(`Error in signup: ${error}`);
      res.status(500).json({
        success: false,
        message: "Server error during registration"
      });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", (req, res, next) => {
    log(`Login attempt for: ${req.body.username}`);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        log(`Login error: ${err}`);
        return res.status(500).json({
          success: false,
          message: "Server error during authentication"
        });
      }
      
      if (!user) {
        log(`Login failed: ${info?.message || 'Authentication failed'}`);
        return res.status(401).json({
          success: false,
          message: info?.message || "Authentication failed"
        });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          log(`Login session error: ${loginErr}`);
          return res.status(500).json({
            success: false,
            message: "Error during login"
          });
        }
        
        log(`Login successful for: ${user.username}`);
        
        // Send user info without password
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json({
          success: true,
          user: userWithoutPassword
        });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    const username = req.user?.username;
    log(`Logout attempt for: ${username || 'unknown user'}`);
    
    req.logout((err) => {
      if (err) {
        log(`Logout error: ${err}`);
        return res.status(500).json({
          success: false,
          message: "Error during logout"
        });
      }
      
      log(`Logout successful for: ${username || 'unknown user'}`);
      res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    });
  });

  // Get current user info
  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      log(`Auth status check: Authenticated as ${req.user.username}`);
      // Send user info without password
      const { password, ...userWithoutPassword } = req.user;
      return res.json({
        isAuthenticated: true,
        user: userWithoutPassword
      });
    } else {
      log('Auth status check: Not authenticated');
      return res.json({
        isAuthenticated: false
      });
    }
  });

  log('Authentication setup completed successfully');
}