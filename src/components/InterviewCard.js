import dayjs from "dayjs";
import Image from "next/image";
import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import DisplayTechIcons from "./DisplayTechIcons";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";

const InterviewCard = async ({
  id,
  userId,
  role,
  type,
  techstack,
  createdAt,
}) => {
  const feedback = userId && id ? await getFeedbackByInterviewId({interviewId: id, userId}) : null;
  const normalizedTyoe = /mix/gi.test(type) ? "Mixed" : type;
  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || date.now()
  ).format("MMM D, YYYY");

  const isCompleted = Boolean(feedback);

  return (
    <article className="w-full">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        {/* Accent bar */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary to-primary/40" />

        <div className="flex flex-col gap-4 px-6 py-5 pl-7 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          {/* Left column: title + meta + description */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <header className="flex items-start gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
                  {role} Interview
                </h3>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {isCompleted ? "Completed session" : "Ready to practice"}
                </p>
              </div>
            </header>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground sm:text-sm">
              <div className="inline-flex items-center gap-2">
                <Image src="/calendar.svg" alt="calendar" width={18} height={18} />
                <span>{formattedDate}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Image src="/star.svg" alt="score" width={18} height={18} />
                <span>
                  <span className="font-semibold text-foreground">
                    {feedback?.totalScore || "---"}
                  </span>{" "}
                  / 100
                </span>
              </div>
            </div>

            <p
              className="line-clamp-2 text-xs text-muted-foreground sm:text-sm"
              title={feedback?.finalAssessment}
            >
              {feedback?.finalAssessment ||
                "You haven't taken the interview yet. Take it now to improve your skills."}
            </p>
          </div>

          {/* Right column: tech + CTA */}
          <div className="flex shrink-0 flex-col items-end gap-3 sm:w-52">
            <span className="inline-flex items-center justify-center rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold tracking-wide text-secondary-foreground capitalize">
              {normalizedTyoe}
            </span>
            <DisplayTechIcons techStack={techstack} />
            <Button
              asChild
              className="h-9 w-full rounded-full px-5 text-xs font-semibold shadow-[var(--shadow-sm)] sm:h-10 sm:text-sm"
            >
              <Link href={isCompleted ? `/interview/${id}/feedback` : `/interview/${id}`}>
                {isCompleted ? "View Feedback" : "Start an interview"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default InterviewCard;
