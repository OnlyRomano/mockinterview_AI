import Agent from "@/components/Agent";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import { 
  getInterviewById, 
  getFeedbackByInterviewId,
  regenerateQuestionsForRetake 
} from "@/lib/actions/general.action";
import { getRandomInterviewCover } from "@/lib/utils";
import Image from "next/image";
import { redirect } from "next/navigation";
import React from "react";

// Force dynamic rendering to ensure questions are regenerated on each retake
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const page = async ({ params }) => {
  const { id } = await params;
  const interview = await getInterviewById(id);
  const user = await getCurrentUser();

  if (!interview) redirect("/");

  // Check if this is a retake (feedback exists)
  const existingFeedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id,
  });

  // Ensure questions array exists
  let questions = interview.question || [];
  
  if (questions.length === 0) {
    console.error("Interview has no questions:", interview);
    redirect("/");
  }
  
  // If feedback exists, it's a retake - regenerate questions
  if (existingFeedback) {
    console.log("Retake detected, regenerating questions for interview:", id);
    const result = await regenerateQuestionsForRetake(id);
    console.log("Regenerate result:", result);
    
    if (result.success && result.questions && result.questions.length > 0) {
      questions = result.questions;
      console.log(`Using ${questions.length} regenerated questions:`, questions);
    } else {
      console.error("Failed to regenerate questions:", result.error || "No questions returned");
      // If regeneration fails, redirect to feedback page with error
      const errorMsg = result.error || "Failed to regenerate questions";
      redirect(`/interview/${id}/feedback?error=${encodeURIComponent(errorMsg)}`);
    }
  } else {
    console.log("First attempt - using original questions:", interview.question);
  }

  return (
    <>
      <div className="flex flex-row gap-4 justify-between">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <h3 className="capitalize">{interview.role} Interview</h3>
          </div>

          <DisplayTechIcons techStack={interview.techstack} />
        </div>

        <p className="bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg h-fit capitalize text-foreground">
          {interview.type}
        </p>
      </div>

      <Agent userName={user?.name} userId={user?.id} interviewId={id} type="interview" questions={questions} />
    </>
  );
};

export default page;
