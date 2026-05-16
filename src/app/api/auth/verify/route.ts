import { NextRequest } from "next/server";
import { compare } from "bcryptjs";
import { usersRepo } from "@/lib/repositories";
import { verifyOtpSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import { jwtEncode } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = verifyOtpSchema.parse(body);

    const user = await usersRepo.getByPhone(phone);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.otp || !user.otpExpiry) {
      throw new ApiError(400, "OTP not requested. Please request a new OTP.");
    }

    // Check OTP expiry
    if (new Date() > user.otpExpiry) {
      await usersRepo.update(user.id, {
        otp: null,
        otpExpiry: null,
      });
      throw new ApiError(400, "OTP expired. Please request a new OTP.");
    }

    // Check OTP attempts
    if (user.otpAttempts >= 3) {
      await usersRepo.update(user.id, {
        otp: null,
        otpExpiry: null,
        otpAttempts: 0,
      });
      throw new ApiError(
        429,
        "Too many OTP attempts. Please request a new OTP.",
      );
    }

    // Verify OTP using bcrypt
    const otpMatches = await compare(otp, user.otp);

    if (!otpMatches) {
      // Increment attempts
      await usersRepo.update(user.id, {
        otpAttempts: user.otpAttempts + 1,
      });

      throw new ApiError(400, "Invalid OTP");
    }

    // Clear OTP and mark user as verified
    await usersRepo.update(user.id, {
      otp: null,
      otpExpiry: null,
      otpAttempts: 0,
      isVerified: true,
      lastLogin: new Date(),
    });

    // Generate JWT token for API authentication
    const token = jwtEncode(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
      },
      "30d",
    );

    return successResponse(
      {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          role: user.role,
          isVerified: true,
        },
      },
      "OTP verified successfully",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
