"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verifyEmailToken = async () => {
      const email = searchParams.get("email");
      const token = searchParams.get("token");

      if (!email || !token) {
        setStatus("error");
        setMessage("Missing verification information. Please check your email link.");
        return;
      }

      try {
        const response = await fetch(
          `/api/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          setTimeout(() => {
            router.push("/sign-in");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to verify email.");
        }
      } catch (error) {
        console.error("Error verifying email:", error);
        setStatus("error");
        setMessage("An error occurred. Please try again later.");
      }
    };

    verifyEmailToken();
  }, [searchParams, router]);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh",
      padding: "20px"
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: "500px"
      }}>
        {status === "verifying" && (
          <div>
            <h2>Verifying your email...</h2>
            <p>Please wait while we confirm your email address.</p>
          </div>
        )}
        
        {status === "success" && (
          <div>
            <h2 style={{ color: "green" }}>✓ Email Verified!</h2>
            <p>{message}</p>
            <p>
              <button 
                onClick={() => router.push("/sign-in")}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                Go to Sign In
              </button>
            </p>
          </div>
        )}
        
        {status === "error" && (
          <div>
            <h2 style={{ color: "red" }}>✗ Verification Failed</h2>
            <p>{message}</p>
            <p>
              <button 
                onClick={() => router.push("/sign-up")}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                Back to Sign Up
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
