"use client";
import { cn } from "@/lib/utils";
import { set } from "mongoose";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

const CallStatus = {
  INACTIVE: "INACTIVE",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
};

const Agent = ({ userName, userId, type, interviewId, questions }) => {
  // console.log("Agent questions prop:", questions); 
  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
  const [messages, setMessages] = useState([]);

  // const callStatus = CallStatus.FINISHED;
  // const isSpeaking = true; // Example state, replace with actual logic
  // const messages = [
  //   "Whats your name?",
  //   "My Name is John Doe, Nice to meet you!",
  // ]; // Example messages, replace with actual logic

  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

    const onMessage = (message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };
    const onSpeachStart = () => setIsSpeaking(true);
    const onSpeachEnd = () => setIsSpeaking(false);

    const onError = (error) => console.log("Error: ", error);

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeachStart);
    vapi.on("speech-end", onSpeachEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeachStart);
      vapi.off("speech-end", onSpeachEnd);
      vapi.off("error", onError);
    };
  });

  const handleGenerateFeedback = async (messages) => {
    console.log("Generating Feedback...");
    const {success, feedbackId: id} =  await createFeedback({
      interviewId: interviewId,
      userId: userId,
      transcript: messages
    })

    if(success && id) {
      router.push(`/interview/${interviewId}/feedback`);
    } else {
      console.log("Error on saving feedback")
      router.push("/");
    }
  }

  useEffect(() => {
    if (callStatus === CallStatus.FINISHED) {
      if(type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      await vapi.start(
        undefined,
        undefined,
        undefined,
        process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID,
        {
          variableValues: {
            username: userName,
            userId: userId,
          },
        }
      );
    } else {
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }
      await vapi.start(interviewer, {
        variableValues: {
          question: formattedQuestions,
        },
      });
    }
  };

  const handleDisconnect = async () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  const latestMessage = messages[messages.length - 1]?.content;

  const iscallInactiveOrFinished =
    callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src={"/ai-avatar.png"}
              alt="AI Avatar"
              width={40}
              height={40}
              className="object-cover"
            />

            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI interviewer</h3>
        </div>
        <div className="card-border">
          <div className="card-content">
            <Image
              src={"/user-avatar.png"}
              alt="User Avatar"
              width={30}
              height={30}
              className="object-cover rounded-full size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      <div>
        {messages.length > 0 && (
          <div className="transcript-border">
            <div className="transcript">
              <p
                key={latestMessage}
                className={cn(
                  "transition-opacity duration-500 opacity-0",
                  "animate-fadeIn opacity-100"
                )}
              >
                {latestMessage}
              </p>
            </div>
          </div>
        )}

        <div className="w-full flex justify-center mt-5">
          {callStatus !== "ACTIVE" ? (
            <button
              className="relative btn-call cursor-pointer"
              onClick={handleCall}
            >
              <span
                className={cn(
                  "absolute animate-ping rounded-full opacity-75",
                  callStatus !== "CONNECTING" && "hidden"
                )}
              />

              <span>{iscallInactiveOrFinished ? "Call" : "..."}</span>
            </button>
          ) : (
            <button
              className="btn-disconnect cursor-pointer"
              onClick={handleDisconnect}
            >
              End
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Agent;
