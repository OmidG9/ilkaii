import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Phone + OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          throw new Error("Phone and OTP required");
        }

        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone as string },
        });

        if (!user) {
          throw new Error("User not found");
        }

        if (!user.otp) {
          throw new Error("No OTP generated");
        }

        if (user.otpExpiry && user.otpExpiry < new Date()) {
          throw new Error("OTP expired");
        }

        if (user.otpAttempts >= 3) {
          throw new Error("Too many failed attempts");
        }

        const otpMatches = await compare(credentials.otp as string, user.otp);

        if (!otpMatches) {
          await prisma.user.update({
            where: { id: user.id },
            data: { otpAttempts: { increment: 1 } },
          });
          throw new Error("Invalid OTP");
        }

        // Clear OTP after successful verification
        await prisma.user.update({
          where: { id: user.id },
          data: {
            otp: null,
            otpExpiry: null,
            otpAttempts: 0,
            isVerified: true,
            lastLogin: new Date(),
          },
        });

        return {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.firstName || user.phone,
          image: user.avatar,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
        token.role = (user as any).role || "CUSTOMER";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
        (session.user as any).role = token.role as UserRole;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Redirect to home after login
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Redirect external URLs to home
      return baseUrl;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
});
