import { Button } from "@/components/ui/button";
import { dummyInterviews, interviewer } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import InterviewCard from "@/components/InterviewCard";
import dynamic from "next/dynamic";
import Spline3D from "@/components/Spline";
import {
  getCurrentUser,
  getInterviewByUserId,
  getLatestInterviews,
} from "@/lib/actions/auth.actions";
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
      <section className="card-cta mt-5">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready With AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice on real interview question & get instant feedback
          </p>
          <Button asChild className="btn-primary max-sm:w-full">
            <Link href={"/interview"}>Start an Interview</Link>
          </Button>
        </div>

        <Spline3D />
      </section>
      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interview</h2>
        <div className="interviews-section">
          {hasPastInterviews ? (
            userInterviews.map((interview) => (
              <InterviewCard {...interview} key={interview.id} />
            ))
          ) : (
            <p>You haven't taken any interviews yet</p>
          )}
        </div>
      </section>
      <section className="flex flex-col gap-6 mt-8">
        <h2>Take an Interview</h2>

        <div className="interviews-section">
          {hasUpcommingInterviews ? (
            latestInterviews.map((interview) => (
              <InterviewCard {...interview} key={interview.id} />
            ))
          ) : (
            <p>There are no new interviews available</p>
          )}
        </div>
      </section>
    </>
  );
};
export default HomePage;
