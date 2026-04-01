import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import InterviewCard from "@/components/InterviewCard";
import Spline3D from "@/components/Spline";
import {
  getCurrentUser,
} from "@/lib/actions/auth.actions";

import { getInterviewByUserId, getLatestInterviews } from "@/lib/actions/general.action";
const HomePage = async () => {
  const user = await getCurrentUser();

  const [userInterviews, latestInterviews] = await Promise.all([
    getInterviewByUserId(user?.id),
    getLatestInterviews({userId: user?.id}),
  ]);
  
  const hasPastInterviews = userInterviews?.length > 0;
  const hasUpcommingInterviews = latestInterviews?.length > 0;

  return (
    <>
      <section className="mt-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-3xl border border-border bg-card/80 px-8 py-8 shadow-[0_22px_60px_rgba(15,23,42,0.16)] backdrop-blur-sm max-sm:px-5 max-sm:py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              AI mock interviews, replays & feedback
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Practice real interviews,{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                get actionable feedback
              </span>
              , and grow faster.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Jump into a realistic voice interview with an AI interviewer, then
              review a detailed breakdown of your performance, strengths, and
              areas to improve.
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="h-10 rounded-full px-6 text-sm font-semibold shadow-[var(--shadow-sm)]"
              >
                <Link href={"/interview"}>Create an interview</Link>
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                <span>Instant feedback after every session</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-primary/80" />
                <span>Supports behavioral & technical interviews</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-1 items-center justify-center lg:mt-0">
            <div className="relative h-[220px] w-full max-w-md">
              <Spline3D />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          <h2>Your Interview</h2>
          <div className="interviews-section">
            {hasPastInterviews ? (
              userInterviews.map((interview) => (
                <InterviewCard {...interview} key={interview.id} userId={user?.id} />
              ))
            ) : (
              <p>You haven't taken any interviews yet</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h2>Take an Interview</h2>
          <div className="interviews-section">
            {hasUpcommingInterviews ? (
              latestInterviews.map((interview) => (
                <InterviewCard {...interview} key={interview.id} userId={user?.id} />
              ))
            ) : (
              <p>There are no new interviews available</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
};
export default HomePage;
