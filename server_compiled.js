var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports, module) {
    var fs = __require("fs");
    var path2 = __require("path");
    var os = __require("os");
    var crypto2 = __require("crypto");
    var TIPS = [
      "\u25C8 encrypted .env [www.dotenvx.com]",
      "\u25C8 secrets for agents [www.dotenvx.com]",
      "\u2301 auth for agents [www.vestauth.com]",
      "\u2318 custom filepath { path: '/custom/path/.env' }",
      "\u2318 enable debugging { debug: true }",
      "\u2318 override existing { override: true }",
      "\u2318 suppress logs { quiet: true }",
      "\u2318 multiple files { path: ['.env.local', '.env'] }"
    ];
    function _getRandomTip() {
      return TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    function parseBoolean(value) {
      if (typeof value === "string") {
        return !["false", "0", "no", "off", ""].includes(value.toLowerCase());
      }
      return Boolean(value);
    }
    function supportsAnsi() {
      return process.stdout.isTTY;
    }
    function dim(text) {
      return supportsAnsi() ? `\x1B[2m${text}\x1B[0m` : text;
    }
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.error(`\u26A0 ${message}`);
    }
    function _debug(message) {
      console.log(`\u2506 ${message}`);
    }
    function _log(message) {
      console.log(`\u25C7 ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path2.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path2.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
      const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (debug || !quiet) {
        _log("loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path2.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
      let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("no encoding is specified (UTF-8 is used by default)");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path3 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path3, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`failed to load ${path3} ${e.message}`);
          }
          lastError = e;
        }
      }
      const populated = DotenvModule.populate(processEnv, parsedAll, options);
      debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
      quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);
      if (debug || !quiet) {
        const keysCount = Object.keys(populated).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path2.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injected env (${keysCount}) from ${shortPaths.join(",")} ${dim(`// tip: ${_getRandomTip()}`)}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`you set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto2.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      const populated = {};
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
            populated[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
          populated[key] = parsed[key];
        }
      }
      return populated;
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module.exports.configDotenv = DotenvModule.configDotenv;
    module.exports._configVault = DotenvModule._configVault;
    module.exports._parseVault = DotenvModule._parseVault;
    module.exports.config = DotenvModule.config;
    module.exports.decrypt = DotenvModule.decrypt;
    module.exports.parse = DotenvModule.parse;
    module.exports.populate = DotenvModule.populate;
    module.exports = DotenvModule;
  }
});

// server.ts
var import_dotenv = __toESM(require_main(), 1);
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import compression from "compression";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "inves4business",
  appId: "1:625343509874:web:cf554ccd2cf094772bd9eb",
  apiKey: "AIzaSyB9DI2v-j6WbehNmeKcLBa8rFe9vdWeSJM",
  authDomain: "inves4business.firebaseapp.com",
  storageBucket: "inves4business.firebasestorage.app",
  messagingSenderId: "625343509874",
  measurementId: "G-H4ZKH0RE4S"
};

// server.ts
import_dotenv.default.config();
process.on("uncaughtException", (err) => {
  console.error("CRITICAL: Uncaught Exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("CRITICAL: Unhandled Rejection at:", promise, "reason:", reason);
});
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key";
var FRIENDLY_CAPTCHA_SECRET = process.env.FRIENDLY_CAPTCHA_SECRET || "";
var signupRateLimits = /* @__PURE__ */ new Map();
var DISPOSABLE_DOMAINS = /* @__PURE__ */ new Set([
  "tempmail.com",
  "10minutemail.com",
  "dispostable.com",
  "guerrillamail.com",
  "temp-mail.org",
  "maildrop.cc",
  "yopmail.com",
  "mailinator.com"
]);
var isDisposableEmail = (email) => {
  const domain = email.split("@")[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.has(domain);
};
var generateOTP = () => {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
};
var serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (serviceAccountVar && serviceAccountVar !== "FIREBASE_SERVICE_ACCOUNT" && serviceAccountVar.startsWith("{")) {
  try {
    const serviceAccount = JSON.parse(serviceAccountVar);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized with Service Account.");
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON.");
  }
} else {
  try {
    admin.initializeApp({
      projectId: firebase_applet_config_default.projectId
    });
    console.log("Firebase Admin initialized with Project ID.");
  } catch (e) {
    console.error("Firebase Admin initialization failed. Please provide FIREBASE_SERVICE_ACCOUNT in Secrets.");
  }
}
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
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    console.log("Admin user seeded successfully.");
  }
}
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3e3;
  console.log(`Starting server process... PORT detected: ${process.env.PORT || "not set (defaulting to 3000)"}`);
  app.use(helmet({
    contentSecurityPolicy: false,
    // Disable for Vite dev server compatibility
    crossOriginEmbedderPolicy: false
  }));
  app.use(compression());
  app.use(express.json());
  try {
    await seedAdmin();
  } catch (error) {
    console.error("Failed to seed admin user. This usually happens if the Firestore API is not enabled or credentials are missing.");
    console.error("Error details:", error);
  }
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };
  const adminOnly = (req, res, next) => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }
    next();
  };
  const getRazorpay = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error("Razorpay keys are missing");
    }
    return new Razorpay({ key_id, key_secret });
  };
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, phone, password, role, captchaSolution } = req.body;
      const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
      const now = Date.now();
      const userLimits = signupRateLimits.get(ip) || { attempts: 0, lastAttempt: 0 };
      if (userLimits.attempts >= 3 && now - userLimits.lastAttempt < 36e5) {
        return res.status(429).json({ error: "Too many signup attempts. Please try again in an hour." });
      }
      if (FRIENDLY_CAPTCHA_SECRET && captchaSolution) {
      }
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
      const otpExpiry = new Date(now + 3e5).toISOString();
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpiry = new Date(now + 6e5).toISOString();
      const newUser = {
        name,
        email,
        phone,
        password: hashedPassword,
        role: role || "user",
        // "user", "seller", "admin"
        status: "active",
        // Default to active or use verification flow
        authProvider: "email",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const docRef = await db.collection("users").add(newUser);
      await db.collection("user_security").doc(docRef.id).set({
        otp,
        otpExpiry,
        otpAttempts: 0,
        verificationToken,
        verificationTokenExpiry,
        lastSignupAttempt: now,
        lastResendAt: 0
      });
      signupRateLimits.set(ip, { attempts: userLimits.attempts + 1, lastAttempt: now });
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { uid, otp } = req.body;
      const db = admin.firestore();
      const securityDoc = await db.collection("user_security").doc(uid).get();
      if (!securityDoc.exists) return res.status(404).json({ error: "User not found" });
      const securityData = securityDoc.data();
      if (securityData.otpAttempts >= 3) {
        return res.status(403).json({ error: "Maximum attempts reached. Please request a new OTP." });
      }
      if (new Date(securityData.otpExpiry) < /* @__PURE__ */ new Date()) {
        return res.status(400).json({ error: "OTP has expired" });
      }
      if (securityData.otp !== otp) {
        await securityDoc.ref.update({ otpAttempts: securityData.otpAttempts + 1 });
        return res.status(400).json({ error: "Invalid OTP" });
      }
      await db.collection("users").doc(uid).update({ status: "Active" });
      await securityDoc.ref.update({ otp: null, otpAttempts: 0 });
      res.json({ status: "Active", message: "Account verified successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/auth/verify-email-token", async (req, res) => {
    try {
      const { uid, token } = req.body;
      const db = admin.firestore();
      const securityDoc = await db.collection("user_security").doc(uid).get();
      if (!securityDoc.exists) return res.status(404).json({ error: "User not found" });
      const securityData = securityDoc.data();
      if (new Date(securityData.verificationTokenExpiry) < /* @__PURE__ */ new Date()) {
        return res.status(400).json({ error: "Verification link expired" });
      }
      if (securityData.verificationToken !== token) {
        return res.status(400).json({ error: "Invalid verification link" });
      }
      await db.collection("users").doc(uid).update({ status: "Active" });
      await securityDoc.ref.update({ verificationToken: null });
      res.json({ status: "Active", message: "Account verified via link successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { uid } = req.body;
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
      const userData = userDoc.data();
      const securityDoc = await db.collection("user_security").doc(uid).get();
      const securityData = securityDoc.data();
      const now = Date.now();
      if (securityData.lastResendAt && now - securityData.lastResendAt < 3e4) {
        return res.status(429).json({ error: "Please wait 30 seconds before requesting again" });
      }
      const otp = generateOTP();
      const otpExpiry = new Date(now + 3e5).toISOString();
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpiry = new Date(now + 6e5).toISOString();
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/auth/google-sync", async (req, res) => {
    try {
      const { googleUser } = req.body;
      if (!googleUser || !googleUser.email) return res.status(400).json({ error: "Invalid Google user data" });
      const db = admin.firestore();
      const userRef = db.collection("users").where("email", "==", googleUser.email);
      const snapshot = await userRef.get();
      let userDocId;
      let userData;
      if (snapshot.empty) {
        const newUser = {
          name: googleUser.displayName || "Google User",
          email: googleUser.email,
          role: "user",
          status: "active",
          authProvider: "google",
          profileImage: googleUser.photoURL,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const docRef = await db.collection("users").add(newUser);
        userDocId = docRef.id;
        userData = newUser;
      } else {
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
    } catch (error) {
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
        return res.json({ message: "If an account with that email exists, a reset link has been sent." });
      }
      const userDoc = snapshot.docs[0];
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = Date.now() + 36e5;
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, token, newPassword } = req.body;
      if (admin.apps.length === 0) throw new Error("Database not initialized");
      const db = admin.firestore();
      const userRef = db.collection("users").where("email", "==", email).where("resetToken", "==", token);
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/admin/users", authenticateToken, adminOnly, async (req, res) => {
    try {
      const db = admin.firestore();
      const usersSnap = await db.collection("users").get();
      const users = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.json(users);
    } catch (error) {
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
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      await db.collection("reviews").add({
        listingId: id,
        status,
        remarks: feedback || "",
        adminId: req.user.uid,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.json({ message: `Listing ${status} successfully` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/payment/create", async (req, res) => {
    try {
      const { amount, currency = "INR" } = req.body;
      const razorpay = getRazorpay();
      const options = {
        amount: amount * 100,
        // amount in the smallest currency unit
        currency,
        receipt: `receipt_${Date.now()}`
      };
      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error) {
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
      const generated_signature = crypto.createHmac("sha256", key_secret).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
      if (generated_signature === razorpay_signature) {
        if (admin.apps.length > 0) {
          const db = admin.firestore();
          const expiryDate = /* @__PURE__ */ new Date();
          expiryDate.setMonth(expiryDate.getMonth() + 1);
          await db.collection("users").doc(userId).update({
            subscription: {
              planId,
              active: true,
              expiryDate: expiryDate.toISOString(),
              listingCount: 0
            }
          });
          await db.collection("orders").add({
            userId,
            listingId: "",
            // Not always tied to a single listing during generic plan upgrade
            plan: planId,
            amount: planId === "Silver" ? 999 : planId === "Gold" ? 2499 : 4999,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            paymentStatus: "paid",
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        res.json({ status: "success" });
      } else {
        res.status(400).json({ status: "failure", message: "Invalid signature" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const sendEmail = async (to, subject, text, html) => {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html
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
    const now = /* @__PURE__ */ new Date();
    const sevenDaysFromNow = /* @__PURE__ */ new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    try {
      const usersSnap = await db.collection("users").where("subscription.active", "==", true).get();
      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const sub = userData.subscription;
        if (!sub || !sub.expiryDate) continue;
        const expiryDate = new Date(sub.expiryDate);
        const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24));
        if (diffDays === 7 && !userData.notified7Days) {
          await sendEmail(
            userData.email,
            "Your Inves4Business Subscription Expires in 7 Days",
            `Hello ${userData.name},

Your subscription will expire on ${expiryDate.toLocaleDateString()}. Please renew to keep your listings active.`,
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
        if (diffDays <= 0) {
          await sendEmail(
            userData.email,
            "Your Inves4Business Subscription Has Expired",
            `Hello ${userData.name},

Your subscription has expired. Your listings are now hidden.`,
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
            notified7Days: false
            // Reset for next time
          });
          const listingsSnap = await db.collection("listings").where("ownerId", "==", userDoc.id).get();
          const batch = db.batch();
          listingsSnap.docs.forEach((doc) => {
            batch.update(doc.ref, { status: "expired" });
          });
          await batch.commit();
        }
      }
    } catch (error) {
      console.error("Subscription check error:", error);
    }
  };
  setInterval(checkSubscriptions, 24 * 60 * 60 * 1e3);
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
        `Hello,

Your business listing "${businessTitle}" has been ${status}.

${feedback ? `Feedback: ${feedback}

` : ""}Best regards,
Inves4Business Team`,
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
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
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
