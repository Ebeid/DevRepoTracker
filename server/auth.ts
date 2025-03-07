import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

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

const MemoryStore = createMemoryStore(session);

export function setupAuth(app: Express) {
  // Generate a random session secret if not provided
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: false, // set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Attempting login for user: ${username}`);
        const user = await storage.getUserByUsername(username);
        console.log(`User found:`, user ? 'yes' : 'no');

        if (!user) {
          console.log('Login failed: User not found');
          return done(null, false, { message: "Invalid username or password" });
        }

        const isValidPassword = await comparePasswords(password, user.password);
        console.log(`Password validation:`, isValidPassword ? 'success' : 'failed');

        if (!isValidPassword) {
          console.log('Login failed: Invalid password');
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log('Login successful');
        return done(null, user);
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await storage.getUser(id);
      if (user) {
        console.log('User found during deserialization');
      } else {
        console.log('User not found during deserialization');
      }
      done(null, user);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      console.log('Registration attempt for username:', req.body.username);

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log('Registration failed: Username already exists');
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        username: req.body.username,
        password: hashedPassword,
      });

      console.log('User created successfully:', user.id);

      req.login(user, (err) => {
        if (err) {
          console.error('Login after registration failed:', err);
          return res.status(500).json({ message: "Login failed after registration" });
        }
        console.log('Registration complete and user logged in');
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('Login attempt for username:', req.body.username);

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        console.log('Authentication failed:', info?.message);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.status(500).json({ message: "Login failed" });
        }
        console.log('Login successful for user:', user.id);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    if (req.user) {
      console.log('Logging out user:', req.user.id);
    }
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      console.log('Logout successful');
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('Unauthenticated user access attempt');
      return res.sendStatus(401);
    }
    console.log('Authenticated user access:', req.user.id);
    res.json(req.user);
  });
}