"use client";

import { Suspense } from "react";
import VerifyEmailContent from "./verify-email-content";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
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
          <h2>Verifying your email...</h2>
          <p>Please wait while we confirm your email address.</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
