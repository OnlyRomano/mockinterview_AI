"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import FaceDetection from "./FaceDetection";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";

const CallStatus = {
  INACTIVE: "INACTIVE",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
};

const Agent = ({ userName, userId, type, interviewId, questions }) => {
  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
  const [messages, setMessages] = useState([]);
  const { processFaceData, startTracking, stopTracking } = useFaceDetection();

  // Log questions when they change
  useEffect(() => {
    if (questions && questions.length > 0) {
      console.log("Agent component received questions:", questions);
    }
  }, [questions]);

  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

    const onMessage = (message) => {
      if (message.type === "conversation-update") {
        const list = message.messages ?? message.conversation ?? [];
        const newEntries = list
          .map((m) => {
            const content = (m.message ?? m.content ?? m.text ?? "").trim();
            if (!content) return null;
            const r = String(m.role ?? "").toLowerCase();
            const role = r === "bot" || r === "assistant" || r === "agent" ? "assistant" : "user";
            return { role, content };
          })
          .filter(Boolean);
        if (newEntries.length) {
          setMessages((prev) => {
            const combined = [...prev];
            newEntries.forEach((entry) => {
              if (!combined.length || combined[combined.length - 1].content !== entry.content) {
                combined.push(entry);
              }
            });
            return combined;
          });
        }
        return;
      }

      let text = "";
      let role = message.role ?? "user";
      if (message.type === "transcript") {
        const isFinal = message.transcriptType === "final";
        text = (message.transcript || message.content || "").trim();
        const isAssistant = ["assistant", "agent"].includes(String(role).toLowerCase());
        if (!text) return;
        if (!isFinal && !isAssistant) return;
        role = isAssistant ? "assistant" : "user";
      } else if (message.type === "model-output" || message.type === "agent-response") {
        text = (message.content ?? message.text ?? message.message ?? message.delta ?? "").trim();
        if (!text) return;
        role = "assistant";
      } else if (message.message?.role === "assistant" && (message.message?.content || message.message?.message)) {
        text = String(message.message?.content ?? message.message?.message ?? "").trim();
        if (!text) return;
        role = "assistant";
      } else {
        return;
      }
      setMessages((prev) => [...prev, { role, content: text }]);
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

    // Stop face detection and get aggregated data
    const faceDetectionData = stopTracking();

    const { success, feedbackId: id } = await createFeedback({
      interviewId: interviewId,
      userId: userId,
      transcript: messages,
      faceDetectionData: faceDetectionData,
    });

    if (success && id) {
      router.push(`/interview/${interviewId}/feedback`);
    } else {
      console.log("Error on saving feedback");
      router.push("/");
    }
  };

  useEffect(() => {
    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    // Start face detection tracking
    startTracking();

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
      } else {
        console.warn("No questions provided to Agent component");
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

  const callStatusLabel =
    callStatus === CallStatus.ACTIVE
      ? "In call"
      : callStatus === CallStatus.CONNECTING
      ? "Connecting"
      : callStatus === CallStatus.FINISHED
      ? "Finished"
      : "Ready";

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Live mock interview
          </p>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Speak with the AI interviewer and see your reactions in real time.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border",
            callStatus === CallStatus.ACTIVE
              ? "border-emerald-500 text-emerald-600 bg-emerald-50"
              : callStatus === CallStatus.CONNECTING
              ? "border-amber-500 text-amber-600 bg-amber-50"
              : "border-border text-muted-foreground bg-card"
          )}
        >
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
          {callStatusLabel}
        </span>
      </div>

      <div className="call-view">
        {/* AI interviewer */}
        <div className="card-interviewer">
          <div className="avatar">
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-foreground">AI interviewer</h3>
            <p className="text-sm text-muted-foreground">
              Real-time voice interview powered by AI
            </p>
          </div>
        </div>

        {/* User / camera */}
        {type === "generate" && (
          <div className="card-interviewer">
            <div className="avatar">
              <Image
                src={"/profile.svg"}
                alt="User Avatar"
                width={30}
                height={30}
                className="object-cover rounded-full size-[120px] border border-border shadow-[var(--shadow-sm)] bg-card"
              />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-foreground">{userName}</h3>
              <p className="text-sm text-muted-foreground">Candidate</p>
            </div>
          </div>
        )}

        {type !== "generate" && (
          <div className="card-border">
            <div className="card-content h-full p-0 overflow-hidden">
              <FaceDetection
                onFaceData={processFaceData}
                isActive={
                  callStatus === CallStatus.ACTIVE ||
                  callStatus === CallStatus.CONNECTING
                }
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
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

        <div className="flex w-full justify-center">
          {callStatus !== CallStatus.ACTIVE ? (
            <Button
              type="button"
              className={cn(
                "relative h-12 rounded-full px-8 text-base",
                callStatus === CallStatus.CONNECTING && "cursor-wait"
              )}
              disabled={callStatus === CallStatus.CONNECTING}
              onClick={handleCall}
            >
              <span
                className={cn(
                  "absolute inset-0 -z-10 rounded-full animate-ping bg-primary/30",
                  callStatus !== CallStatus.CONNECTING && "hidden"
                )}
              />

              <span>{iscallInactiveOrFinished ? "Start interview" : "..."}</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              className="h-12 rounded-full px-8 text-base"
              onClick={handleDisconnect}
            >
              End interview
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Agent;

Agent.propTypes = {
  userName: PropTypes.string,
  userId: PropTypes.string,
  type: PropTypes.string,
  interviewId: PropTypes.string,
  questions: PropTypes.arrayOf(PropTypes.string),
};
