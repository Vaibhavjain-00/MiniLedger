import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { pool } from "../../config/db";
import { HttpError } from "../../utils/httpError";
type OtpRecord = { otp: string; expiresAt: number };
const otpStore = new Map<string, OtpRecord>();
export function normalizePhone(phone: string) { return phone.replace(/[\s()-]/g, ""); }
export function sendOtp(input: string) { const phone = normalizePhone(input); const ttl = Number(process.env.OTP_TTL_MINUTES || 5); const otp = crypto.randomInt(0, 1000000).toString().padStart(6, "0"); otpStore.set(phone, { otp, expiresAt: Date.now() + ttl * 60000 }); console.log(`[MiniLedger mock OTP] phone=${phone} otp=${otp} (expires in ${ttl} minutes)`); return { phone, expiresInMinutes: ttl }; }
export async function verifyOtp(input: string, otp: string) {
 const phone = normalizePhone(input); const record = otpStore.get(phone);
 if (!record || record.expiresAt < Date.now() || record.otp !== otp) { if (record && record.expiresAt < Date.now()) otpStore.delete(phone); throw new HttpError(401, "Invalid or expired OTP"); }
 otpStore.delete(phone);
 const result = await pool.query<{id:string;phone:string}>(`INSERT INTO users (phone) VALUES ($1) ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone RETURNING id, phone`, [phone]);
 const user = result.rows[0]; const secret = process.env.JWT_SECRET; if (!secret) throw new HttpError(500, "JWT_SECRET is not configured");
 const token = jwt.sign({ userId: user.id, phone: user.phone }, secret, { expiresIn: "7d" }); return { token, user };
}
