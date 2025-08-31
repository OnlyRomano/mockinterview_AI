import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

const CallStatus = {
  INACTIVE: "INACTIVE",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
};

const Agent = ({ userName }) => {
  const callStatus = CallStatus.FINISHED;
  const isSpeaking = true; // Example state, replace with actual logic
  const messages = ["Whats your name?", "My Name is John Doe, Nice to meet you!"]; // Example messages, replace with actual logic

  const lastMessage = messages[messages.length - 1];
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
                <p key={lastMessage} className={cn('transition-opacity duration-500 opacity-0', 'animate-fadeIn opacity-100')}>
                    {lastMessage}
                </p>
            </div>
        </div>
        )}

        <div className="w-full flex justify-center mt-5">
          {callStatus !== "ACTIVE" ? (
            <button className="relative btn-call cursor-pointer">
              <span
                className={cn(
                  "absolute animate-ping rounded-full opacity-75",
                  (callStatus !== "CONNECTING") & "hidden"
                )}
              />

              <span>
                {callStatus === "INACTIVE" || callStatus === "FINISHED"
                  ? "Call"
                  : "..."}
              </span>
            </button>
          ) : (
            <button className="btn-disconnect cursor-pointer">End</button>
          )}
        </div>
      </div>
    </>
  );
};

export default Agent;
