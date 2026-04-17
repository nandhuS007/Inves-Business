import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import compression from "compression";

import firebaseConfig from "./firebase-applet-config.json";

dotenv.config();

// Global Error Handlers for Production Debugging
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key";
const FRIENDLY_CAPTCHA_SECRET = process.env.FRIENDLY_CAPTCHA_SECRET || "";

// Rate Limit Store
const signupRateLimits: Map<string, { attempts: number; lastAttempt: number }> = new Map();

// Disposable Email Domains
const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "10minutemail.com", "dispostable.com", 
  "guerrillamail.com", "temp-mail.org", "maildrop.cc",
  "yopmail.com", "mailinator.com"
]);

const isDisposableEmail = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.has(domain);
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Initialize Firebase Admin
const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (serviceAccountVar && serviceAccountVar !== "FIREBASE_SERVICE_ACCOUNT" && serviceAccountVar.startsWith("{")) {
  try {
    const serviceAccount = JSON.parse(serviceAccountVar);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized with Service Account.");
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON.");
  }
} else {
  // Try initializing with just Project ID (works in some environments with default credentials)
  try {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log("Firebase Admin initialized with Project ID.");
  } catch (e) {
    console.error("Firebase Admin initialization failed. Please provide FIREBASE_SERVICE_ACCOUNT in Secrets.");
  }
}

// Seed Admin User
async function seedAdmin() {
  if (admin.apps.length === 0) return;
  const db = admin.firestore();
  const adminEmail = "nandhanandha2426@gmail.com";
  const adminPassword = "Nandha@123";
  
  const userRef = db.collection("users").where("email", "==", adminEmail);
  const snapshot = await userRef.get();
  
  if (snapshot.empty) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await db.collection("users").add({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString()
    });
    console.log("Admin user seeded successfully.");
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  console.log(`Starting server process... PORT detected: ${process.env.PORT || 'not set (defaulting to 3000)'}`);

  app.use(helmet({
    contentSecurityPolicy: false, // Disable for Vite dev server compatibility
    crossOriginEmbedderPolicy: false
  }));
  app.use(compression());
  app.use(express.json());

  // Seed Admin
  try {
    await seedAdmin();
  } catch (error) {
    console.error("Failed to seed admin user. This usually happens if the Firestore API is not enabled or credentials are missing.");
    console.error("Error details:", error);
  }

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const adminOnly = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }
    next();
  };

  // Razorpay Instance
  const getRazorpay = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error("Razorpay keys are missing");
    }
    return new Razorpay({ key_id, key_secret });
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, phone, password, role, captchaSolution } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

      // 1. Rate Limiting
      const now = Date.now();
      const userLimits = signupRateLimits.get(ip as string) || { attempts: 0, lastAttempt: 0 };
      if (userLimits.attempts >= 3 && now - userLimits.lastAttempt < 3600000) {
        return res.status(429).json({ error: "Too many signup attempts. Please try again in an hour." });
      }

      // 2. CAPTCHA Verification (Optional if secret provided)
      if (FRIENDLY_CAPTCHA_SECRET && captchaSolution) {
        // Implement verification call if needed
      }

      // 3. Disposable Email Blocking
      if (isDisposableEmail(email)) {
        return res.status(400).json({ error: "Please use a valid email address" });
      }

      if (admin.apps.length === 0) throw new Error("Database not initialized");
      
      const db = admin.firestore();
      const userRef = db.collection("users").where("email", "==", email);
      const snapshot = await userRef.get();
      
      if (!snapshot.empty) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = generateOTP();
      const otpExpiry = new Date(now + 300000).toISOString(); // 5 minutes
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpiry = new Date(now + 600000).toISOString(); // 10 minutes

      const newUser = {
        name,
        email,
        phone,
        password: hashedPassword,
        role: role || "user", // "user", "seller", "admin"
        status: "active", // Default to active or use verification flow
        authProvider: "email",
        createdAt: new Date().toISOString()
      };

      const docRef = await db.collection("users").add(newUser);
      
      // Store security data
      await db.collection("user_security").doc(docRef.id).set({
        otp,
        otpExpiry,
        otpAttempts: 0,
        verificationToken,
        verificationTokenExpiry,
        lastSignupAttempt: now,
        lastResendAt: 0
      });

      // Update rate limits
      signupRateLimits.set(ip as string, { attempts: userLimits.attempts + 1, lastAttempt: now });

      // Send Verification Email
      const verificationLink = `${process.env.APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}&uid=${docRef.id}`;
      
      await sendEmail(
        email,
        "Verify your Inves4Business account",
        `Your OTP is ${otp}. Or verify via this link: ${verificationLink}`,
        `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #002366; text-align: center;">Welcome to Inves4Business</h2>
            <p>Please use the following OTP to verify your account. It expires in 5 minutes.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #002366; margin: 20px 0;">
              ${otp}
            </div>
            <p>Alternatively, click the button below to verify your email. The link expires in 10 minutes.</p>
            <div style="text-align: center;">
              <a href="${verificationLink}" style="display: inline-block; background: #002366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Verify Email</a>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">If you didn't sign up for an account, you can safely ignore this email.</p>
          </div>
        `
      );

      res.json({ uid: docRef.id, message: "Verification code sent to your email" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { uid, otp } = req.body;
      const db = admin.firestore();
      
      const securityDoc = await db.collection("user_security").doc(uid).get();
      if (!securityDoc.exists) return res.status(404).json({ error: "User not found" });

      const securityData = securityDoc.data()!;
      if (securityData.otpAttempts >= 3) {
        return res.status(403).json({ error: "Maximum attempts reached. Please request a new OTP." });
      }

      if (new Date(securityData.otpExpiry) < new Date()) {
        return res.status(400).json({ error: "OTP has expired" });
      }

      if (securityData.otp !== otp) {
        await securityDoc.ref.update({ otpAttempts: securityData.otpAttempts + 1 });
        return res.status(400).json({ error: "Invalid OTP" });
      }

      // Success
      await db.collection("users").doc(uid).update({ status: "Active" });
      await securityDoc.ref.update({ otp: null, otpAttempts: 0 });

      res.json({ status: "Active", message: "Account verified successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/verify-email-token", async (req, res) => {
    try {
      const { uid, token } = req.body;
      const db = admin.firestore();
      
      const securityDoc = await db.collection("user_security").doc(uid).get();
      if (!securityDoc.exists) return res.status(404).json({ error: "User not found" });

      const securityData = securityDoc.data()!;
      if (new Date(securityData.verificationTokenExpiry) < new Date()) {
        return res.status(400).json({ error: "Verification link expired" });
      }

      if (securityData.verificationToken !== token) {
        return res.status(400).json({ error: "Invalid verification link" });
      }

      // Success
      await db.collection("users").doc(uid).update({ status: "Active" });
      await securityDoc.ref.update({ verificationToken: null });

      res.json({ status: "Active", message: "Account verified via link successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { uid } = req.body;
      const db = admin.firestore();
      
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
      const userData = userDoc.data()!;

      const securityDoc = await db.collection("user_security").doc(uid).get();
      const securityData = securityDoc.data()!;

      const now = Date.now();
      if (securityData.lastResendAt && now - securityData.lastResendAt < 30000) {
        return res.status(429).json({ error: "Please wait 30 seconds before requesting again" });
      }

      const otp = generateOTP();
      const otpExpiry = new Date(now + 300000).toISOString();
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpiry = new Date(now + 600000).toISOString();

      await securityDoc.ref.update({
        otp,
        otpExpiry,
        otpAttempts: 0,
        verificationToken,
        verificationTokenExpiry,
        lastResendAt: now
      });

      const verificationLink = `${process.env.APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}&uid=${uid}`;

      await sendEmail(
        userData.email,
        "Your new verification code for Inves4Business",
        `Your new OTP is ${otp}. Link: ${verificationLink}`,
        `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #002366; text-align: center;">Inves4Business Verification</h2>
            <p>You requested a new verification code. It expires in 5 minutes.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #002366; margin: 20px 0;">
              ${otp}
            </div>
            <p>Alternatively, use this button (expires in 10 minutes):</p>
            <div style="text-align: center;">
              <a href="${verificationLink}" style="display: inline-block; background: #002366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Verify Email</a>
            </div>
          </div>
        `
      );

      res.json({ message: "New verification code sent" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (admin.apps.length === 0) throw new Error("Database not initialized");

      const db = admin.firestore();
      const userRef = db.collection("users").where("email", "==", email);
      const snapshot = await userRef.get();

      if (snapshot.empty) {
        return res.status(400).json({ error: "User not found" });
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      if (userData.status === "Unverified") {
        return res.status(403).json({ 
          error: "Account not verified", 
          uid: userDoc.id, 
          needsVerification: true 
        });
      }

      if (userData.status === "Blocked") {
        return res.status(403).json({ error: "Account is blocked" });
      }

      const validPassword = await bcrypt.compare(password, userData.password);

      const token = jwt.sign(
        { id: userDoc.id, uid: userDoc.id, email: userData.email, role: userData.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Generate Firebase Custom Token
      const firebaseToken = await admin.auth().createCustomToken(userDoc.id, { 
        role: userData.role,
        email: userData.email,
        email_verified: true
      });

      res.json({ 
        token, 
        firebaseToken,
        user: { id: userDoc.id, uid: userDoc.id, name: userData.name, email: userData.email, role: userData.role } 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/google-sync", async (req, res) => {
    try {
      const { googleUser } = req.body; // User info from Firebase Client SDK
      if (!googleUser || !googleUser.email) return res.status(400).json({ error: "Invalid Google user data" });

      const db = admin.firestore();
      const userRef = db.collection("users").where("email", "==", googleUser.email);
      const snapshot = await userRef.get();

      let userDocId;
      let userData;

      if (snapshot.empty) {
        // Create new auto-verified user
        const newUser = {
          name: googleUser.displayName || "Google User",
          email: googleUser.email,
          role: "user",
          status: "active",
          authProvider: "google",
          profileImage: googleUser.photoURL,
          createdAt: new Date().toISOString()
        };
        const docRef = await db.collection("users").add(newUser);
        userDocId = docRef.id;
        userData = newUser;
      } else {
        // Link to existing user and update status
        const doc = snapshot.docs[0];
        userDocId = doc.id;
        userData = doc.data();
        await doc.ref.update({ 
          authProvider: "google", 
          status: "active", 
          profileImage: googleUser.photoURL || userData.profileImage 
        });
      }

      const token = jwt.sign(
        { id: userDocId, uid: userDocId, email: googleUser.email, role: userData.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const firebaseToken = await admin.auth().createCustomToken(userDocId, { 
        role: userData.role,
        email: googleUser.email,
        email_verified: true
      });

      res.json({ 
        token, 
        firebaseToken,
        user: { id: userDocId, uid: userDocId, name: googleUser.displayName, email: googleUser.email, role: userData.role } 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (admin.apps.length === 0) throw new Error("Database not initialized");

      const db = admin.firestore();
      const userRef = db.collection("users").where("email", "==", email);
      const snapshot = await userRef.get();

      if (snapshot.empty) {
        // For security, don't reveal if user exists
        return res.json({ message: "If an account with that email exists, a reset link has been sent." });
      }

      const userDoc = snapshot.docs[0];
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour

      await userDoc.ref.update({
        resetToken,
        resetTokenExpiry
      });

      const resetLink = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${email}`;

      await sendEmail(
        email,
        "Password Reset Request - Inves4Business",
        `You requested a password reset. Click here to reset your password: ${resetLink}`,
        `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #002366;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You requested to reset your password for your Inves4Business account.</p>
            <p>Click the button below to set a new password. This link will expire in 1 hour.</p>
            <a href="${resetLink}" style="display: inline-block; background: #002366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">Reset Password</a>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">If you did not request this, please ignore this email.</p>
            <p style="font-size: 12px; color: #666;">Best regards,<br/>Inves4Business Team</p>
          </div>
        `
      );

      res.json({ message: "If an account with that email exists, a reset link has been sent." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, token, newPassword } = req.body;
      if (admin.apps.length === 0) throw new Error("Database not initialized");

      const db = admin.firestore();
      const userRef = db.collection("users")
        .where("email", "==", email)
        .where("resetToken", "==", token);
      
      const snapshot = await userRef.get();

      if (snapshot.empty) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      if (userData.resetTokenExpiry < Date.now()) {
        return res.status(400).json({ error: "Reset token has expired" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await userDoc.ref.update({
        password: hashedPassword,
        resetToken: admin.firestore.FieldValue.delete(),
        resetTokenExpiry: admin.firestore.FieldValue.delete()
      });

      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Protected Admin Routes
  app.get("/api/admin/dashboard", authenticateToken, adminOnly, async (req, res) => {
    try {
      const db = admin.firestore();
      const usersSnap = await db.collection("users").get();
      const listingsSnap = await db.collection("listings").get();
      const paymentsSnap = await db.collection("payments").get();

      res.json({
        totalUsers: usersSnap.size,
        totalBusinesses: listingsSnap.size,
        totalRevenue: paymentsSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/users", authenticateToken, adminOnly, async (req, res) => {
    try {
      const db = admin.firestore();
      const usersSnap = await db.collection("users").get();
      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/listings/approve/:id", authenticateToken, adminOnly, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body;
      const db = admin.firestore();
      
      await db.collection("listings").doc(id).update({
        status,
        adminFeedback: feedback || "",
        updatedAt: new Date().toISOString()
      });

      // Log Review activity
      await db.collection("reviews").add({
        listingId: id,
        status,
        remarks: feedback || "",
        adminId: (req as any).user.uid,
        updatedAt: new Date().toISOString()
      });
      
      res.json({ message: `Listing ${status} successfully` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payment/create", async (req, res) => {
    try {
      const { amount, currency = "INR" } = req.body;
      const razorpay = getRazorpay();
      const options = {
        amount: amount * 100, // amount in the smallest currency unit
        currency,
        receipt: `receipt_${Date.now()}`,
      };
      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId } = req.body;
      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!key_secret) {
        return res.status(500).json({ error: "Razorpay secret is missing" });
      }

      const generated_signature = crypto
        .createHmac("sha256", key_secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature === razorpay_signature) {
        // Payment verified
        if (admin.apps.length > 0) {
          const db = admin.firestore();
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month subscription

          // Update user subscription
          await db.collection("users").doc(userId).update({
            subscription: {
              planId,
              active: true,
              expiryDate: expiryDate.toISOString(),
              listingCount: 0
            }
          });

          // Log order
          await db.collection("orders").add({
            userId,
            listingId: "", // Not always tied to a single listing during generic plan upgrade
            plan: planId,
            amount: planId === "Silver" ? 999 : planId === "Gold" ? 2499 : 4999,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            paymentStatus: "paid",
            createdAt: new Date().toISOString()
          });
        }
        res.json({ status: "success" });
      } else {
        res.status(400).json({ status: "failure", message: "Invalid signature" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const sendEmail = async (to: string, subject: string, text: string, html: string) => {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html,
      });
      return true;
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
    }
  };

  const checkSubscriptions = async () => {
    console.log("Running subscription expiration check...");
    const db = admin.firestore();
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    try {
      const usersSnap = await db.collection("users").where("subscription.active", "==", true).get();
      
      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const sub = userData.subscription;
        if (!sub || !sub.expiryDate) continue;

        const expiryDate = new Date(sub.expiryDate);
        const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // 7-day warning
        if (diffDays === 7 && !userData.notified7Days) {
          await sendEmail(
            userData.email,
            "Your Inves4Business Subscription Expires in 7 Days",
            `Hello ${userData.name},\n\nYour subscription will expire on ${expiryDate.toLocaleDateString()}. Please renew to keep your listings active.`,
            `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #002366;">Subscription Expiring Soon</h2>
                <p>Hello <strong>${userData.name}</strong>,</p>
                <p>Your Inves4Business subscription is set to expire in <strong>7 days</strong> (on ${expiryDate.toLocaleDateString()}).</p>
                <p>To ensure your business listings remain visible to potential buyers, please renew your plan soon.</p>
                <a href="${process.env.APP_URL || "#"}/pricing" style="display: inline-block; background: #002366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">Renew Now</a>
                <p style="margin-top: 30px; font-size: 12px; color: #666;">Best regards,<br/>Inves4Business Team</p>
              </div>
            `
          );
          await userDoc.ref.update({ notified7Days: true });
        }

        // Expiration
        if (diffDays <= 0) {
          await sendEmail(
            userData.email,
            "Your Inves4Business Subscription Has Expired",
            `Hello ${userData.name},\n\nYour subscription has expired. Your listings are now hidden.`,
            `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #ef4444;">Subscription Expired</h2>
                <p>Hello <strong>${userData.name}</strong>,</p>
                <p>Your Inves4Business subscription has expired.</p>
                <p>Your business listings have been hidden from the public browse page. Renew your subscription to reactivate them.</p>
                <a href="${process.env.APP_URL || "#"}/pricing" style="display: inline-block; background: #002366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">Renew Subscription</a>
                <p style="margin-top: 30px; font-size: 12px; color: #666;">Best regards,<br/>Inves4Business Team</p>
              </div>
            `
          );
          await userDoc.ref.update({ 
            "subscription.active": false,
            notified7Days: false // Reset for next time
          });
          
          // Also hide their listings
          const listingsSnap = await db.collection("listings").where("ownerId", "==", userDoc.id).get();
          const batch = db.batch();
          listingsSnap.docs.forEach(doc => {
            batch.update(doc.ref, { status: "expired" });
          });
          await batch.commit();
        }
      }
    } catch (error) {
      console.error("Subscription check error:", error);
    }
  };

  // Run check every 24 hours
  setInterval(checkSubscriptions, 24 * 60 * 60 * 1000);

  app.post("/api/admin/check-subscriptions", authenticateToken, adminOnly, async (req, res) => {
    await checkSubscriptions();
    res.json({ message: "Subscription check completed" });
  });

  app.post("/api/admin/notify-listing-status", authenticateToken, adminOnly, async (req, res) => {
    try {
      const { vendorEmail, businessTitle, status, feedback } = req.body;
      
      const success = await sendEmail(
        vendorEmail,
        `Business Listing Update: ${businessTitle}`,
        `Hello,\n\nYour business listing "${businessTitle}" has been ${status}.\n\n${feedback ? `Feedback: ${feedback}\n\n` : ""}Best regards,\nInves4Business Team`,
        `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #002366;">Inves4Business Listing Update</h2>
            <p>Hello,</p>
            <p>Your business listing "<strong>${businessTitle}</strong>" has been <span style="color: ${status === "approved" ? "#10b981" : "#ef4444"}; font-weight: bold;">${status}</span>.</p>
            ${feedback ? `<div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;"><strong>Feedback:</strong><br/>${feedback}</div>` : ""}
            <p>Best regards,<br/><strong>Inves4Business Team</strong></p>
          </div>
        `
      );

      if (success) {
        res.json({ status: "success" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error: any) {
      console.error("Email error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "built_site");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
