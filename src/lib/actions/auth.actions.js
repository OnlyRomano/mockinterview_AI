"use server";

import md5 from "md5";
import crypto from "crypto";
import User from "../models/User";
import { getSession, saveSession, clearSession } from "../session";
import dbConnect from "../db";
import { redirect } from "next/dist/server/api-utils";
import Interview from "../models/Interview";
import { Types } from "mongoose";
import { sendVerificationEmail } from "../sendEmail";

// Password validation function
function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&* etc.)");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export async function signUp({ email, password, name }) {
  try {
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: passwordValidation.errors.join(". "),
        passwordErrors: passwordValidation.errors,
      };
    }

    await dbConnect();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return {
        success: false,
        message: "User already exists. Please sign in again",
      };
    }

    const hashedPassword = md5(password);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    const newUser = new User({ 
      email, 
      password: hashedPassword, 
      name,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry: tokenExpiry,
    });

    await newUser.save();

    if (!newUser?._id) {
      return {
        success: false,
        message: "Failed to create user. Please try again later.",
      };
    }

    // Send verification email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const emailResult = await sendVerificationEmail({
      email,
      verificationToken,
      appUrl,
    });

    if (!emailResult.success) {
      console.warn("Verification email failed to send:", emailResult.error);
    }

    return {
      success: true,
      message: "User created successfully. Please check your email to verify your account.",
      email,
    };
  } catch (error) {
    console.error("Error in signUp:", error);
    return {
      success: false,
      message: "Failed to create user. Please try again.",
    };
  }
}

export async function signIn({ email, password }) {
  try {
    await dbConnect();
    const hashedPassword = md5(password);
    const user = await User.findOne({ email, password: hashedPassword });
    if (!user) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    if (!user.emailVerified) {
      return {
        success: false,
        message: "Email not verified. Please verify your email before signing in.",
        requiresEmailVerification: true,
        email: user.email,
      };
    }

    await saveSession({
      userId: user._id,
      email: user.email,
      name: user.name,
      isLoggedIn: true,
    });
    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error) {
    console.error("Error in signIn:", error);
    return {
      success: false,
      message: "Failed to sign in. Please try again.",
    };
  }
}

export async function signOut() {
  await clearSession();
  return {
    success: true,
    message: "Signed out successfully.",
  };
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session?.isLoggedIn || !session?.userId) return null;
    await dbConnect();
    const userDoc = await User.findById(session.userId)
      .select("-password")
      .lean();
    if (!userDoc) return null;

    return {
      id: String(userDoc._id),
      email: userDoc.email,
      name: userDoc.name,
    };
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

export async function verifyEmail({ email, verificationToken }) {
  try {
    await dbConnect();
    
    // First check if user exists by email
    const userByEmail = await User.findOne({ email });
    
    // If user exists and email is already verified, return already-verified status
    if (userByEmail && userByEmail.emailVerified) {
      return {
        success: true,
        message: "Your email has already been verified. You can sign in now.",
        alreadyVerified: true,
      };
    }
    
    // Now check if token matches
    const user = await User.findOne({ email, verificationToken });
    
    if (!user) {
      return {
        success: false,
        message: "Invalid verification token or email.",
      };
    }

    // Check if token has expired
    if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
      return {
        success: false,
        message: "Verification link has expired. Please sign up again to get a new link.",
      };
    }

    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    return {
      success: true,
      message: "Email verified successfully. You can now sign in.",
    };
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    return {
      success: false,
      message: "Failed to verify email. Please try again.",
    };
  }
}

