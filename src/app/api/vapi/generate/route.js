import dbConnect from "@/lib/db";
import Interview from "@/lib/models/Interview";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { isAuthenticated } from "@/lib/actions/auth.actions";

export async function GET() {
  return Response.json({ success: true, data: "Thank You!" }, { status: 200 });
}

export async function POST(request) {
  // const user = await isAuthenticated();

  // if (!user) {
  //   return Response.json(
  //     { success: false, error: "Unauthorized." },
  //     { status: 401 }
  //   );
  // }

  await dbConnect();
  const { type, role, level, techstack, amount, userId } = await request.json();

  try {
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare question for a job interview.
            The job role is ${role}.
            The experience level is ${level}.
            The tech stack used in the job is ${techstack}.
            The focus between Behavioral and Technical question should lean toward: ${type}.
            The amount of question required is: ${amount}.
            Please return only the question, without any additional text.
            The question are going to be ready by a voide assistance so do not use "/" or "*" or any special characters which might break the voice assistance.
            Return the question formatted like this: ["Question 1", "Question 2", "Question 3"]
            
            Thank You!`,
    });

    const interview = await Interview.create({
      userId: userId,
      role,
      type,
      level,
      techstack: techstack.split(","),
      question: JSON.parse(questions),
      finalized: true,
    });

    return Response.json({ success: true, interview }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, error: "Failed to generate interview questions." },
      { status: 500 }
    );
  }
}
