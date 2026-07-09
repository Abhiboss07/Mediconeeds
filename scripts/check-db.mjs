import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";

// Read MONGODB_URI from .env.local
const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const match = envContent.match(/MONGODB_URI\s*=\s*(.+)/);
if (!match) {
  console.error("Could not find MONGODB_URI in .env.local");
  process.exit(1);
}
const MONGODB_URI = match[1].trim().replace(/['"]/g, "");

// Load schemas dynamically
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", UserSchema, "users");

const SellerSchema = new mongoose.Schema({}, { strict: false });
const Seller = mongoose.models.Seller || mongoose.model("Seller", SellerSchema, "sellers");

const EmailOutboxSchema = new mongoose.Schema({}, { strict: false });
const EmailOutbox = mongoose.models.EmailOutbox || mongoose.model("EmailOutbox", EmailOutboxSchema, "email_outbox");

const AuditLogSchema = new mongoose.Schema({}, { strict: false });
const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema, "audit_logs");

async function check() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  const usersCount = await User.countDocuments();
  const sellersCount = await Seller.countDocuments();
  const outboxCount = await EmailOutbox.countDocuments();
  const auditCount = await AuditLog.countDocuments();

  console.log(`\n--- DATABASE COUNTS ---`);
  console.log(`Users: ${usersCount}`);
  console.log(`Sellers: ${sellersCount}`);
  console.log(`EmailOutbox: ${outboxCount}`);
  console.log(`AuditLogs: ${auditCount}`);

  console.log(`\n--- RECENT SELLERS ---`);
  const recentSellers = await Seller.find().sort({ createdAt: -1 }).limit(2);
  for (const s of recentSellers) {
    console.log(`ID: ${s._id}, Email: ${s.get("email")}, Company: ${s.get("company")}, Approval: ${s.get("approval")}, RefRef: ${s.get("applicationRef")}`);
  }

  console.log(`\n--- RECENT OUTBOX MAILS ---`);
  const recentMails = await EmailOutbox.find().sort({ createdAt: -1 }).limit(3);
  for (const m of recentMails) {
    console.log(`To: ${m.get("to")}, Subject: ${m.get("subject")}, Status: ${m.get("status")}, Error: ${m.get("error") || "none"}`);
  }

  await mongoose.disconnect();
}

check().catch(console.error);
