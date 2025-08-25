"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { connectToDatabase } from "@/lib/mongoose";
import Feedback from "@/models/Feedback";
import Interview from "@/models/Interview";
import { feedbackSchema } from "@/constants";

export async function createFeedback(params) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
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

    await connectToDatabase();

    const doc = {
      interviewId,
      userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date(),
    };

    let id;
    if (feedbackId) {
      const res = await Feedback.findByIdAndUpdate(feedbackId, doc, { new: true });
      id = String(res?._id);
    } else {
      const res = await Feedback.create(doc);
      id = String(res._id);
    }

    return { success: true, feedbackId: id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id) {
  try {
    await connectToDatabase();
    const interview = await Interview.findById(id).lean();
    if (!interview) return null;

    return {
      id: String(interview._id),
      ...(interview),
    };
  } catch (error) {
    console.error("Error getting interview:", error);
    return null;
  }
}

export async function getFeedbackByInterviewId(params) {
  const { interviewId, userId } = params;

  try {
    await connectToDatabase();
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

export async function getLatestInterviews(
  params
) {
  const { userId, limit = 20 } = params;

  try {
    await connectToDatabase();
    const interviews = await Interview.find({ finalized: true, userId: { $ne: userId } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return interviews.map((i) => ({ id: String(i._id), ...i }));
  } catch (error) {
    console.error("Error getting latest interviews:", error);
    return null;
  }
}

export async function getInterviewsByUserId(
  userId
) {
  try {
    await connectToDatabase();
    const interviews = await Interview.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return interviews.map((i) => ({ id: String(i._id), ...i }));
  } catch (error) {
    console.error("Error getting user interviews:", error);
    return null;
  }
}
