import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, resetPasswordRequestSchema, resetPasswordSchema } from "@shared/schema";
import { sendPasswordResetEmail } from "./utils/email-service";

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

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Forgot password route
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const parsedBody = resetPasswordRequestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const { username } = parsedBody.data;
      const user = await storage.getUserByUsername(username);

      // Even if user is not found, return success to prevent user enumeration
      if (!user) {
        return res.json({ 
          success: true,
          message: "If an account with this email exists, a password reset link will be sent."
        });
      }

      // Create a password reset token
      const { token } = await storage.createPasswordResetToken(user.id);

      // Try to send password reset email, but continue even if it fails
      try {
        await sendPasswordResetEmail(
          user.username,
          token,
          user.username.split('@')[0] // Simple way to get a displayable name
        );
      } catch (emailError) {
        // Log the error but don't expose it to the user
        console.error(`Failed to send password reset email to: ${user.username}`, emailError);
      }

      // Always return success to prevent user enumeration, even if email sending fails
      return res.json({ 
        success: true,
        message: "If an account with this email exists, a password reset link has been sent."
      });
    } catch (error) {
      console.error('Error in forgot password:', error);
      res.status(500).json({ 
        success: false,
        message: "An error occurred while processing your request." 
      });
    }
  });

  // Reset password route
  app.post("/api/reset-password", async (req, res) => {
    try {
      const parsedBody = resetPasswordSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid reset request",
          errors: parsedBody.error.format()
        });
      }

      const { token, newPassword } = parsedBody.data;

      // Validate the token and get the associated user
      const user = await storage.validatePasswordResetToken(token);
      if (!user) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid or expired token. Please request a new password reset link."
        });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Update the user's password
      await storage.updateUserPassword(user.id, hashedPassword);

      // Mark the token as used
      await storage.markTokenAsUsed(token);

      return res.json({ 
        success: true,
        message: "Password has been reset successfully. You can now log in with your new password."
      });
    } catch (error) {
      console.error('Error in reset password:', error);
      res.status(500).json({ 
        success: false,
        message: "An error occurred while processing your request."
      });
    }
  });

  // DEVELOPMENT ONLY: Endpoint to get the latest reset token for a user
  // Only for development/testing - would be removed in production
  app.get("/api/dev/reset-token", async (req, res) => {
    try {
      const { username } = req.query;

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "Username parameter is required" 
        });
      }

      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      // Create a new token for testing
      const { token } = await storage.createPasswordResetToken(user.id);

      return res.json({ 
        success: true, 
        token,
        message: "Development reset token created successfully" 
      });
    } catch (error) {
      console.error('Error generating dev reset token:', error);
      res.status(500).json({ 
        success: false, 
        message: "Server error generating token" 
      });
    }
  });
}