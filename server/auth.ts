import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./vite";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Convertir scrypt a versión que devuelve promesas para uso con async/await
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Configuración de la sesión
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "agenda-ia-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 semana
      httpOnly: true,
      sameSite: 'lax'
    }
  };

  // Configuración de proxy para producción
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }
  
  log("Setting up authentication middleware...", "express");
  
  // Configuración de middleware de sesión y passport
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configuración de estrategia local para autenticación
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Buscar usuario por nombre de usuario
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Usuario no encontrado" });
        }
        
        // Verificar contraseña
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Contraseña incorrecta" });
        }
        
        // Usuario y contraseña correctos
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Serialización y deserialización de usuario para la sesión
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Ruta para registro de usuarios
  app.post("/api/register", async (req, res, next) => {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "El usuario ya existe" });
      }

      // Crear usuario con contraseña hasheada
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Iniciar sesión automáticamente después del registro
      req.login(user, (err) => {
        if (err) return next(err);
        // Devolver el usuario sin la contraseña por seguridad
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Ruta para inicio de sesión
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Falló la autenticación" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        // Devolver el usuario sin la contraseña por seguridad
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Ruta para cerrar sesión
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Ruta para obtener el usuario actual
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autenticado" });
    }
    
    // Devolver el usuario sin la contraseña por seguridad
    const userWithoutPassword = { ...req.user };
    delete userWithoutPassword.password;
    res.json(userWithoutPassword);
  });

  // Ruta para verificar estado de autenticación
  app.get("/api/auth/status", (req, res) => {
    const isAuthenticated = req.isAuthenticated();
    const userId = req.session?.userId;
    
    log(`Auth status check: ${isAuthenticated ? "Authenticated" : "Not authenticated"}, User ID: ${userId || 'none'}`, "express");
    
    // Proporcionar más información para depuración
    res.json({ 
      isAuthenticated: isAuthenticated,
      userId: isAuthenticated ? userId : null,
      sessionActive: !!req.session,
      sessionId: req.session?.id || null
    });
  });
  
  log("Authentication setup completed successfully", "express");
  console.log("Authentication setup completed successfully");
}