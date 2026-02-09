"use server";

import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { feedbackNarrativeSchema } from "@/constants";
import dbConnect from "../db";
import Feedback from "../models/Feedback";
import Interview from "../models/Interview";
import questionIndexer from "../databank/questionIndexer";
import { scoreFeedbackDeterministic } from "../scoring/feedbackScorer";

export async function createFeedback(params) {
  const { interviewId, userId, transcript, feedbackId, faceDetectionData } =
    params;

  try {
    // ensure DB connection
    await dbConnect();

    const interview = await Interview.findById(interviewId).lean();

    const {
      totalScore,
      categoryScores,
      strengths: deterministicStrengths,
      areasForImprovement: deterministicAreas,
      finalAssessment: deterministicFinalAssessment,
      perQuestionScores,
    } = await scoreFeedbackDeterministic({
      transcript,
      faceDetectionData,
      interview,
    });

    // Bring back AI-written narrative (but keep algorithmic scores)
    const formattedTranscript = Array.isArray(transcript)
      ? transcript
          .map((sentence) => `- ${sentence.role}: ${sentence.content}\n`)
          .join("")
      : "";

    const faceSummary = (() => {
      if (!faceDetectionData) return "";
      const base = `Face Detection Summary:`;
      if (faceDetectionData.isDetected === false) {
        return `\n${base} No reliable face detected during the call.`;
      }
      const parts = [];
      if (typeof faceDetectionData.averageConfidence === "number") {
        parts.push(
          `Avg confidence ${(faceDetectionData.averageConfidence * 100).toFixed(1)}%`,
        );
      }
      if (faceDetectionData.dominantExpression) {
        parts.push(
          `Dominant expression ${faceDetectionData.dominantExpression}`,
        );
      }
      if (
        typeof faceDetectionData.faceDetectionDuration === "number" &&
        typeof faceDetectionData.faceDetectionSamples === "number"
      ) {
        parts.push(
          `Duration ${(faceDetectionData.faceDetectionDuration / 1000).toFixed(1)}s over ${faceDetectionData.faceDetectionSamples} samples`,
        );
      }
      if (typeof faceDetectionData.lookingAwayRatio === "number") {
        parts.push(
          `Looking away ${(faceDetectionData.lookingAwayRatio * 100).toFixed(1)}% of time`,
        );
      }
      if (typeof faceDetectionData.multiPersonRatio === "number") {
        parts.push(
          `Multiple people visible ${(faceDetectionData.multiPersonRatio * 100).toFixed(1)}% of time`,
        );
      }
      if (typeof faceDetectionData.gazeAwayRatio === "number") {
        parts.push(
          `Eyes off-screen/reading ${(faceDetectionData.gazeAwayRatio * 100).toFixed(1)}% of time`,
        );
      }
      return parts.length ? `\n${base} ${parts.join("; ")}` : "";
    })();

    let strengths = deterministicStrengths;
    let areasForImprovement = deterministicAreas;
    let finalAssessment = deterministicFinalAssessment;

    // Replace category comments with AI summaries (same category names; keep scores)
    let categoryScore = categoryScores;

    try {
      const { object } = await generateObject({
        model: google("gemini-2.5-flash-lite", { structuredOutputs: false }),
        schema: feedbackNarrativeSchema,
        prompt: `You are a professional interviewer. Write feedback text ONLY (no scores).

          Interview context:
          - Role: ${interview?.role || "N/A"}
          - Level: ${interview?.level || "N/A"}
          - Type: ${interview?.type || "N/A"}

          Transcript:
          ${formattedTranscript}

          ${faceSummary}

          Write:
          1) A short but specific summary comment for EACH of these 6 categories (keep it honest and actionable):
             - Communication Skills
             - Technical Knowledge
             - Problem Solving
             - Cultural Fit
             - Confidence and Clarity
             - Face Detection (based on the face detection metrics/summary provided above)
          2) Strengths (bullet-like strings).
          3) Areas for improvement (bullet-like strings).
          4) Final assessment (a short paragraph).

          Do NOT invent categories. Do NOT output any numbers or scores.`,
        system:
          "You are a professional interviewer writing structured feedback text for a mock interview.",
      });

      const commentByName = new Map(
        (object.categorySummaries || []).map((c) => [c.name, c.comment]),
      );

      categoryScore = categoryScores.map((c) => ({
        ...c,
        comment: commentByName.get(c.name) || c.comment,
      }));

      strengths = object.strengths?.length ? object.strengths : strengths;
      areasForImprovement = object.areasForImprovement?.length
        ? object.areasForImprovement
        : areasForImprovement;
      finalAssessment = object.finalAssessment || finalAssessment;
    } catch (narrativeError) {
      console.warn(
        "Failed to generate AI narrative feedback; using deterministic text.",
        narrativeError,
      );
    }

    const doc = {
      interviewId,
      userId,
      totalScore,
      categoryScore,
      strengths,
      areasForImprovement,
      finalAssessment,
      perQuestionScores: perQuestionScores || [],
    };

    let res;
    if (feedbackId) {
      // Try to update the provided feedback id
      res = await Feedback.findByIdAndUpdate(feedbackId, doc, { new: true });
      if (!res) {
        // If not found, create a new document
        res = await Feedback.create(doc);
      }
    } else {
      // Ensure single feedback per (interviewId, userId) by upserting
      res = await Feedback.findOneAndUpdate({ interviewId, userId }, doc, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      });
    }

    return {
      success: true,
      feedbackId: String(res._id),
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

export async function regenerateQuestionsForRetake(interviewId) {
  try {
    await dbConnect();

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      console.error("Interview not found:", interviewId);
      return { success: false, error: "Interview not found" };
    }

    // Initialize retakeCount and maxRetakes if they don't exist (for old interviews)
    const retakeCount = interview.retakeCount || 0;
    const maxRetakes = interview.maxRetakes || 3;

    // Check if retake limit has been reached
    if (retakeCount >= maxRetakes) {
      console.log(`Retake limit reached: ${retakeCount}/${maxRetakes}`);
      return {
        success: false,
        error: `Maximum retakes (${maxRetakes}) reached for this interview`,
      };
    }

    console.log(
      `Regenerating questions for interview ${interviewId}, retake ${retakeCount + 1}/${maxRetakes}`,
    );
    console.log(`Previous questions to exclude:`, interview.question);

    // Get reference questions from databank
    const techstackString = interview.techstack.join(",");
    const referenceQuestions = questionIndexer.getReferenceQuestions(
      interview.level,
      techstackString,
      interview.type,
    );

    // Get the previous questions that were already used (to exclude them)
    const previousQuestions = interview.question || [];
    const previousQuestionsText =
      previousQuestions.length > 0
        ? `\n\nIMPORTANT - DO NOT USE THESE PREVIOUS QUESTIONS (they were already asked in this interview):\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nYou MUST create completely different questions that are NOT similar to any of the above.`
        : "";

    // Create prompt for regenerating questions
    const referenceQuestionsText =
      referenceQuestions.length > 0
        ? `\n\nHere are some example ${interview.type} questions from our databank for ${interview.level} level ${techstackString} interviews:\n${referenceQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nUse these as inspiration and reference to create NEW, UNIQUE ${interview.type} questions that are similar in style, complexity, and focus but are original and not duplicates of the examples above.`
        : "";

    const amount = interview.question.length; // Keep the same number of questions

    const { text: questions } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      prompt: `You are generating a NEW set of interview questions for a retake interview. The candidate has already answered different questions, so you MUST create COMPLETELY NEW questions.

            Job Details:
            - Role: ${interview.role}
            - Experience Level: ${interview.level}
            - Tech Stack: ${techstackString}
            - Interview Type: ${interview.type}
            
            ${previousQuestionsText}
            
            ${referenceQuestionsText}
            
            CRITICAL REQUIREMENTS (READ CAREFULLY):
            1. Generate EXACTLY ${amount} questions (no more, no less)
            2. These questions MUST be COMPLETELY DIFFERENT from the previous questions - do NOT reuse, rephrase, or modify them
            3. Each question should explore DIFFERENT topics, scenarios, or technical concepts
            4. Vary the question types - mix conceptual, practical, problem-solving, and scenario-based questions
            5. Ensure questions cover different aspects of ${techstackString} and ${interview.role}
            6. Match the complexity appropriate for ${interview.level} level
            7. Questions should be suitable for ${interview.type} interview type
            8. Questions will be read by a voice assistant - avoid special characters like "/", "*", or symbols
            9. Return ONLY a valid JSON array with EXACTLY ${amount} questions
            10. Do NOT include markdown formatting, code blocks, or any other text
            11. Start your response directly with [ and end with ]
            
            Example format: ["Question 1", "Question 2", "Question 3"]
            
            Remember: The goal is to test the candidate on DIFFERENT knowledge areas and scenarios than the previous interview.`,
    });

    // Clean up the response
    let cleanQuestions = questions.trim();

    // Remove markdown code blocks if present
    if (cleanQuestions.startsWith("```json")) {
      cleanQuestions = cleanQuestions
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (cleanQuestions.startsWith("```")) {
      cleanQuestions = cleanQuestions
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "");
    }

    let generatedQuestions;
    try {
      generatedQuestions = JSON.parse(cleanQuestions);
    } catch (parseError) {
      console.error("Failed to parse generated questions:", cleanQuestions);
      throw new Error("Failed to parse generated questions as JSON");
    }

    // Validate questions array
    if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
      console.error(
        "Generated questions is not a valid array:",
        generatedQuestions,
      );
      throw new Error("Generated questions is not a valid array");
    }

    // Ensure we have exactly the requested amount
    const finalQuestions = generatedQuestions.slice(0, amount);

    if (finalQuestions.length === 0) {
      throw new Error("No questions generated after processing");
    }

    console.log(`Generated ${finalQuestions.length} questions successfully`);
    console.log(`New questions:`, finalQuestions);
    console.log(`Previous questions were:`, previousQuestions);

    // Verify questions are different
    const questionsAreDifferent = !finalQuestions.some((newQ, idx) => {
      const prevQ = previousQuestions[idx];
      if (!prevQ) return false;
      // Check if questions are too similar (more than 70% word overlap)
      const newWords = newQ.toLowerCase().split(/\s+/);
      const prevWords = prevQ.toLowerCase().split(/\s+/);
      const commonWords = newWords.filter((w) => prevWords.includes(w));
      const similarity =
        commonWords.length / Math.max(newWords.length, prevWords.length);
      return similarity > 0.7;
    });

    if (!questionsAreDifferent) {
      console.warn(
        "WARNING: Generated questions may be too similar to previous questions",
      );
    } else {
      console.log(
        "✓ Verified: New questions are sufficiently different from previous questions",
      );
    }

    // Update interview with new questions and increment retake count
    interview.question = finalQuestions;
    interview.retakeCount = retakeCount + 1;
    interview.maxRetakes = maxRetakes; // Ensure maxRetakes is set
    await interview.save();

    console.log(
      `Successfully regenerated ${finalQuestions.length} questions for interview ${interviewId}`,
    );

    return {
      success: true,
      questions: finalQuestions,
      retakeCount: interview.retakeCount,
    };
  } catch (error) {
    console.error("Error regenerating questions:", error);
    return {
      success: false,
      error: `Failed to regenerate interview questions: ${error.message}`,
    };
  }
}
