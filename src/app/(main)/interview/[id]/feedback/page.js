import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

const page = async ({ params, searchParams }) => {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id,
  });

  const retakeCount = interview.retakeCount || 0;
  const maxRetakes = interview.maxRetakes || 2;
  const canRetake = retakeCount < maxRetakes;
  const errorMessage = searchParamsResolved?.error;

  return (
    <section className="section-feedback backdrop-blur-md p-4 rounded-2xl">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      <div className="flex flex-row justify-center ">
        <div className="flex flex-row gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore}
              </span>
              /100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>

          {/* Retake Count */}
          <div className="flex flex-row gap-2 items-center">
            <p>
              Retakes:{" "}
              <span className="text-primary-200 font-bold">
                {retakeCount}/{maxRetakes}
              </span>
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mt-4">
          <p className="font-semibold">Error: {errorMessage}</p>
        </div>
      )}

      {!canRetake && (
        <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-200 p-4 rounded-lg mt-4">
          <p className="font-semibold">
            Maximum retakes reached. You have used all {maxRetakes} retake attempts for this interview.
          </p>
        </div>
      )}

      <hr />

      <p>{feedback?.finalAssessment}</p>

      {/* Interview Breakdown (transcript-based categories only) */}
      <div className="flex flex-col gap-4">
        <h2>Breakdown of the Interview:</h2>
        {feedback?.categoryScore
          ?.filter((c) => c.name !== "Face Detection")
          .map((category, index) => (
            <div key={index}>
              <p className="font-bold">
                {index + 1}. {category.name} ({category.score}/100)
              </p>
              <p>{category.comment}</p>
            </div>
          ))}
      </div>

      {/* Face Detection – separate category with its own scoring */}
      {feedback?.categoryScore?.some((c) => c.name === "Face Detection") && (
        <div className="flex flex-col gap-4 mt-6">
          <h2>Face Detection (Engagement):</h2>
          {feedback.categoryScore
            .filter((c) => c.name === "Face Detection")
            .map((category, index) => (
              <div key={index} className="bg-dark-200/40 p-4 rounded-xl">
                <p className="font-bold">
                  {category.name}: <span className="text-primary-200">{category.score}</span>/100
                </p>
                <p>{category.comment}</p>
              </div>
            ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3>Strengths</h3>
        <ul>
          {feedback?.strengths?.map((strength, index) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3>Areas for Improvement</h3>
        <ul>
          {feedback?.areasForImprovement?.map((area, index) => (
            <li key={index}>{area}</li>
          ))}
        </ul>
      </div>

      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        {canRetake ? (
          <Button className="btn-primary flex-1">
            <Link
              href={`/interview/${id}`}
              className="flex w-full justify-center"
            >
              <p className="text-sm font-semibold text-black text-center">
                Retake Interview
              </p>
            </Link>
          </Button>
        ) : (
          <Button className="btn-primary flex-1" disabled>
            <p className="text-sm font-semibold text-black text-center opacity-50">
              Retake Interview (Limit Reached)
            </p>
          </Button>
        )}
      </div>
    </section>
  );
};

export default page;
