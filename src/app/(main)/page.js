import { Button } from "@/components/ui/button";
import { dummyInterviews, interviewer } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import InterviewCard from "@/components/InterviewCard";

const HomePage = () => {
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

        <Image
          src={"/robot.png"}
          alt="Robot"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>
             <section className="flex flex-col gap-6 mt-8">
         <h2>Your Interview</h2>
         <div className="interviews-section">
           {dummyInterviews.map((interview) => (
             <InterviewCard {...interview} key={interview.id} />
           ))}
           {/* <p>You haven't taken any interviews yet</p> */}
         </div>
       </section>
       <section className="flex flex-col gap-6 mt-8">
         <h2>Take an Interview</h2>

         <div className="interviews-section">
           {dummyInterviews.map((interview) => (
             <InterviewCard {...interview} key={interview.id} />
           ))}
         </div>
       </section>
    </>
  );
};
export default HomePage;
