"use server";

import { generateId, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { feedbackSchema } from "@/constants";
import dbConnect from "../db";
import Feedback from "../models/Feedback";
import Interview from "../models/Interview";

export async function createFeedback(params) {
  const { interviewId, userId, transcript } = params;

  try {
    const formattedTranscript = transcript
      .map((sentence) => `- ${sentence.role}: ${sentence.content}\n`)
      .join("");
    const {
      object: {
        totalScore,
        categoryScores,
        strengths,
        areasForImprovement,
        finalAssessment,
      },
    } = await generateObject({
      model: google("gemini-2.0-flash-001", { structuredOutputs: false }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = await Feedback.create({
      interviewId,
      userId,
      totalScore,
      categoryScore: categoryScores,
      strengths,
      areasForImprovement,
      finalAssessment,
    });

    return {
      success: true,
      feedbackId: feedback.id,
    };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

// export async function createFeedback(params) {
//   const { interviewId, userId, transcript, feedbackId } = params;

//   try {
//     const formattedTranscript = transcript
//       .map(
//         (sentence) =>
//           `- ${sentence.role}: ${sentence.content}\n`
//       )
//       .join("");

//     const { object } = await generateObject({
//       model: google("gemini-2.0-flash-001", {
//         structuredOutputs: false,
//       }),
//       schema: feedbackSchema,
//       prompt: `
//         You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
//         Transcript:
//         ${formattedTranscript}

//         Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
//         - **Communication Skills**: Clarity, articulation, structured responses.
//         - **Technical Knowledge**: Understanding of key concepts for the role.
//         - **Problem-Solving**: Ability to analyze problems and propose solutions.
//         - **Cultural & Role Fit**: Alignment with company values and job role.
//         - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
//         `,
//       system:
//         "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
//     });

//     await dbConnect();

//     const doc = {
//       interviewId,
//       userId,
//       totalScore: object.totalScore,
//       categoryScore: object.categoryScores, // match schema field name
//       strengths: object.strengths,
//       areasForImprovement: object.areasForImprovement,
//       finalAssessment: object.finalAssessment,
//     };

//     let id;
//     if (Feedback) {
//       const res = await Feedback.findByIdAndUpdate(feedbackId, doc, { new: true });
//       id = String(res?._id);
//     } else {
//       const res = await Feedback.create(doc);
//       id = String(res._id);
//     }

//     return { success: true, feedbackId: id };
//   } catch (error) {
//     console.error("Error saving feedback:", error);
//     return { success: false };
//   }
// }

export async function getInterviewById(id) {
  try {
    await dbConnect();
    const interview = await Interview.findById(id).lean();
    if (!interview) return null;

    return {
      id: String(interview._id),
      ...interview,
    };
  } catch (error) {
    console.error("Error getting interview:", error);
    return null;
  }
}

export async function getFeedbackByInterviewId(params) {
  const { interviewId, userId } = params;

  try {
    await dbConnect();
    const feedback = await Feedback.findOne({ interviewId, userId }).lean();
    if (!feedback) return null;

    return {
      id: String(feedback._id),
      ...feedback,
    };
  } catch (error) {
    console.error("Error getting feedback:", error);
    return null;
  }
}

export async function getInterviewByUserId(userId) {
  try {
    await dbConnect();

    const interviews = await Interview.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return interviews.map((doc) => ({
      id: doc._id.toString(),
      ...doc,
    }));
  } catch (error) {
    console.error("Error in getInterviewByUserId:", error);
    return [];
  }
}

export async function getLatestInterviews(params) {
  try {
    const { userId, limit = 20 } = params;
    await dbConnect();

    const interviews = await Interview.find({
      userId: { $ne: userId },
      finalized: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return interviews.map((doc) => ({
      id: doc._id.toString(),
      ...doc,
    }));
  } catch (error) {
    console.error("Error in getLatestInterviews:", error);
    return [];
  }
}
