"use server";

import md5 from "md5";
import User from "../models/User";
import { getSession, saveSession, clearSession } from "../session";
import dbConnect from "../db";
import { redirect } from "next/dist/server/api-utils";
import Interview from "../models/Interview";
import { Types } from "mongoose";

export async function signUp({ email, password, name }) {
  try {
    await dbConnect();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return {
        success: false,
        message: "User already exists. Please sign in again",
      };
    }

    const hashedPassword = md5(password);
    const newUser = new User({ email, password: hashedPassword, name });

    await newUser.save();

    if (!newUser?._id) {
      return {
        success: false,
        message: "Failed to create user. Please try again later.",
      };
    }

    return {
      success: true,
      message: "User created successfully. Please sign in.",
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

