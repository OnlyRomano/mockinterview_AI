import dbConnect from "@/lib/db";
import Interview from "@/lib/models/Interview";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { isAuthenticated } from "@/lib/actions/auth.actions";
import interviewQuestions from "@/lib/databank/interview-questions.json";

// Helper function to get reference questions from databank for AI generation
function getReferenceQuestionsFromDatabank(level, techstack, type) {
  const techstackArray = techstack.split(",").map(tech => tech.trim());
  
  // Filter questions based on level, techstack, and type
  const filteredQuestions = interviewQuestions.questions.filter(q => 
    q.level === level && 
    q.type === type &&
    techstackArray.some(tech => 
      q.techstack.toLowerCase().includes(tech.toLowerCase()) ||
      tech.toLowerCase().includes(q.techstack.toLowerCase())
    )
  );
  
  // If no questions found for the specific type, fall back to any type for the level and techstack
  if (filteredQuestions.length === 0) {
    const fallbackQuestions = interviewQuestions.questions.filter(q => 
      q.level === level && 
      techstackArray.some(tech => 
        q.techstack.toLowerCase().includes(tech.toLowerCase()) ||
        tech.toLowerCase().includes(q.techstack.toLowerCase())
      )
    );
    return fallbackQuestions.map(q => q.question);
  }
  
  // Return reference questions for AI to use as inspiration
  return filteredQuestions.map(q => q.question);
}

export async function GET() {
  return Response.json({ success: true, data: "Thank You!" }, { status: 200 });
}

export async function POST(request) {
  await dbConnect();
  const { type, role, level, techstack, amount, userId } = await request.json();

  try {
    // Get reference questions from databank to guide AI generation
    const referenceQuestions = getReferenceQuestionsFromDatabank(level, techstack, type);
    
    // Create a comprehensive prompt that includes reference questions
    const referenceQuestionsText = referenceQuestions.length > 0 
      ? `\n\nHere are some example ${type} questions from our databank for ${level} level ${techstack} interviews:\n${referenceQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nUse these as inspiration and reference to create NEW, UNIQUE ${type} questions that are similar in style, complexity, and focus but are original and not duplicates of the examples above.`
      : '';
    
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare EXACTLY ${amount} interview question(s) for a job interview.
            The job role is ${role}.
            The experience level is ${level}.
            The tech stack used in the job is ${techstack}.
            The focus between Behavioral and Technical question should lean toward: ${type}.
            ${referenceQuestionsText}
            
            Requirements:
            - Generate EXACTLY ${amount} questions (no more, no less)
            - Create NEW, UNIQUE questions that are not duplicates of the reference examples
            - Match the complexity and style appropriate for ${level} level
            - Focus on ${techstack} technologies
            - Questions should be suitable for ${type} interview type
            - Questions will be read by a voice assistant, so avoid special characters like "/", "*", or other symbols that might break voice reading
            - Return ONLY a valid JSON array with EXACTLY ${amount} questions
            - Do NOT include markdown formatting, code blocks, or any other text
            - Start your response directly with [ and end with ]
            - Example format: ["Question 1", "Question 2", "Question 3"]
            
            Thank You!`,
    });

    // Clean up the response in case AI returns markdown formatting
    let cleanQuestions = questions.trim();
    
    // Remove markdown code blocks if present
    if (cleanQuestions.startsWith('```json')) {
      cleanQuestions = cleanQuestions.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanQuestions.startsWith('```')) {
      cleanQuestions = cleanQuestions.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const generatedQuestions = JSON.parse(cleanQuestions);
    
    // Ensure we have exactly the requested amount
    const finalQuestions = generatedQuestions.slice(0, amount);

    const interview = await Interview.create({
      userId,
      role,
      type,
      level,
      techstack: techstack.split(","),
      question: finalQuestions,
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
