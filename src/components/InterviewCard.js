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
  return (
    <div className="w-[360px] max-sm:w-full min-h-60">
      <div className="bg-card border border-border shadow-[var(--shadow-sm)] rounded-3xl p-6 relative flex flex-col gap-6 min-h-60">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="capitalize text-foreground pr-2">{role} Interview</h3>
            <div className="shrink-0 w-fit px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground border border-border">
              <p className="text-xs font-semibold tracking-wide">{normalizedTyoe}</p>
            </div>
          </div>
          {/* <Image
            src={getRandomInterviewCover()}
            alt="cover-image"
            width={90}
            height={90}
            className="rounded-full object-fit size-[90px]"
          /> */}

          <div className="flex flex-row gap-5 mt-3">
            <div className="flex flex-row gap-2">
              <Image
                src={"/calendar.svg"}
                alt="calendar"
                width={22}
                height={22}
              />
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <Image src={"/star.svg"} alt="star" width={22} height={22} />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{feedback?.totalScore || "---"}</span> / 100
              </p>
            </div>
          </div>

          <p className="line-clamp-2 mt-5 text-sm text-muted-foreground" title={feedback?.finalAssessment}>
            {feedback?.finalAssessment ||
              "Yout haven't taken the interview yet. Take it now to improve your skills."}
          </p>
        </div>
        <div className="flex flex-row items-center justify-between pt-2">
          <DisplayTechIcons techStack={techstack}/>
          <Button asChild className="rounded-full px-5 h-10">
            <Link href={feedback ? `/interview/${id}/feedback` : `/interview/${id}`}>
              {feedback ? "Check Feedback" : "Start Interview"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
