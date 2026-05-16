import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { usersRepo } from "@/lib/repositories";
import { loginSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import prisma from "@/lib/prisma";

// Generate OTP - Production: Use secure random
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mock SMS service - Replace with Twilio/AWS SNS in production
async function sendSMS(phone: string, otp: string): Promise<boolean> {
  try {
    // TODO: Integrate with Twilio or AWS SNS
    // For now, log to console (use server logs in production)
    if (process.env.NODE_ENV === "production") {
      console.log(`[SMS] OTP sent to ${phone}: ${otp}`);
      // In production, actually send SMS via service
      // Example: await twilio.messages.create({...})
      return true;
    } else {
      console.log(`[DEV] OTP for ${phone}: ${otp}`); // Development only
      return true;
    }
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = loginSchema.parse(body);

    // Rate limit check: Max 3 OTP requests per hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await prisma.user.count({
      where: {
        phone,
        updatedAt: { gte: hourAgo },
      },
    });

    if (recentRequests >= 3) {
      throw new ApiError(429, "Too many OTP requests. Try again later.");
    }

    // Check if user exists, if not create new user
    let user = await usersRepo.getByPhone(phone);

    if (!user) {
      user = await usersRepo.create({
        phone,
        role: "CUSTOMER",
        isVerified: false,
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hashedOtp = await hash(otp, 10); // Hash OTP for security

    // Save hashed OTP to database
    await usersRepo.update(user.id, {
      otp: hashedOtp,
      otpExpiry,
      otpAttempts: 0,
    });

    // Send OTP via SMS
    const smsSent = await sendSMS(phone, otp);
    if (!smsSent) {
      throw new ApiError(500, "Failed to send OTP. Please try again.");
    }

    return successResponse(
      {
        userId: user.id,
        phone: phone.slice(-4), // Don't reveal full phone
        message: "OTP sent successfully",
      },
      "OTP sent to your phone",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
