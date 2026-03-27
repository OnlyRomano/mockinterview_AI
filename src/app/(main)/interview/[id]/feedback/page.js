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
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id,
  });

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 rounded-3xl border border-border bg-card px-8 py-8 shadow-[var(--shadow-sm)]">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Interview feedback
        </p>
        <h1 className="text-2xl font-semibold sm:text-3xl">
          {interview.role} interview
        </h1>
        <p className="text-sm text-muted-foreground">
          Overall score{" "}
          <span className="font-semibold text-primary">
            {feedback?.totalScore ?? "--"}
          </span>
          /100 ·{" "}
          {feedback?.createdAt
            ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
            : "Date not available"}
        </p>
      </header>

      {feedback?.finalAssessment && (
        <section className="mt-6 space-y-1">
          <h2 className="text-sm font-semibold text-foreground">Overall summary</h2>
          <p className="text-sm text-muted-foreground">
            {feedback.finalAssessment}
          </p>
        </section>
      )}

      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Breakdown by category
        </h2>
        {feedback?.categoryScore
          ?.filter((c) => c.name !== "Face Detection")
          .map((category) => (
            <div key={category.name} className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {category.name}
              </span>{" "}
              ({category.score}/100) – {category.comment}
            </div>
          ))}
      </section>

      {feedback?.categoryScore?.some((c) => c.name === "Face Detection") && (
        <section className="mt-6 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            Engagement (face detection)
          </h2>
          {feedback.categoryScore
            .filter((c) => c.name === "Face Detection")
            .map((category) => (
              <p
                key={category.name}
                className="text-sm text-muted-foreground"
              >
                <span className="font-semibold text-foreground">
                  {category.name}
                </span>{" "}
                ({category.score}/100) – {category.comment}
              </p>
            ))}
        </section>
      )}

      <section className="mt-6 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Strengths</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {feedback?.strengths?.length
            ? feedback.strengths.map((strength) => (
                <li key={strength}>{strength}</li>
              ))
            : <li>No strengths recorded for this session.</li>}
        </ul>
      </section>

      <section className="mt-6 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          Areas for improvement
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {feedback?.areasForImprovement?.length
            ? feedback.areasForImprovement.map((area) => (
                <li key={area}>{area}</li>
              ))
            : <li>No specific improvement areas recorded.</li>}
        </ul>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          asChild
          variant="secondary"
          className="flex-1 h-10 rounded-full px-5 shadow-[var(--shadow-sm)]"
        >
          <Link href="/" className="w-full justify-center">
            Back to dashboard
          </Link>
        </Button>

        <Button
          asChild
          className="flex-1 h-10 rounded-full px-5 shadow-[var(--shadow-sm)]"
        >
          <Link href={`/interview/${id}`} className="w-full justify-center">
            Retake interview
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default page;
