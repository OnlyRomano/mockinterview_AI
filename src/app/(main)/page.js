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
      <div className="mx-auto w-full max-w-7xl">
        <section className="card-cta mt-5">
          <div className="flex flex-col gap-6 max-w-lg">
            <h2>Ace Your Interviews with Smart AI Coaching</h2>
            <p className="text-lg">
              Practice smarter, get feedback faster, and land your dream job
            </p>
            <Button
              asChild
              className="max-sm:w-full rounded-full h-10 px-5 text-sm shadow-[var(--shadow-sm)]"
            >
              <Link href={"/interview"}>Create an Interview</Link>
            </Button>
          </div>

          <Spline3D />
        </section>
      </div>

      <section className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
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
