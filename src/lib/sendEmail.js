import nodemailer from "nodemailer";

// Create a transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendVerificationEmail({ email, verificationToken, appUrl }) {
  try {
    const verificationLink = `${appUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "HireReady AI - Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification Required</h2>
          <p>Thank you for signing up! Please verify your email to continue.</p>
          <p>
            <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p><code>${verificationLink}</code></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, please ignore this email.</p>
          <img src="/logo.svg" alt="HireReady AI Logo" style="width: 150px; margin-top: 20px;" />
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: error.message };
  }
}

export async function sendFeedbackEmail({ to, interview, feedback }) {
  if (!to) {
    return { success: false, error: "No recipient email provided" };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: `Your HireReady AI feedback for ${interview?.role || "your interview"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <h2 style="margin-bottom: 8px;">Your Mock Interview Feedback</h2>
          <p style="margin-top: 0; color: #555;">
            Here is a summary of your recent mock interview in HireReady AI.
          </p>

          <div style="margin: 16px 0; padding: 12px 16px; background: #0f172a; color: #e5e7eb; border-radius: 8px;">
            <p style="margin: 4px 0;">
              <strong>Role:</strong> <span style="text-transform: capitalize;">${interview?.role || "N/A"}</span>
            </p>
            <p style="margin: 4px 0;">
              <strong>Total Score:</strong> ${feedback?.totalScore ?? "---"}/100
            </p>
            <p style="margin: 4px 0;">
              <strong>Date:</strong> ${
                feedback?.createdAt
                  ? new Date(feedback.createdAt).toLocaleString()
                  : "N/A"
              }
            </p>
          </div>

          ${
            Array.isArray(feedback?.categoryScore) && feedback.categoryScore.length
              ? `
          <h3 style="margin-top: 24px;">Category Breakdown</h3>
          <ul style="padding-left: 20px;">
            ${feedback.categoryScore
              .map(
                (cat) => `
              <li style="margin-bottom: 4px;">
                <strong>${cat.name}:</strong> ${cat.score}/100 – ${cat.comment}
              </li>
            `,
              )
              .join("")}
          </ul>
          `
              : ""
          }

          ${
            Array.isArray(feedback?.strengths) && feedback.strengths.length
              ? `
          <h3 style="margin-top: 24px;">Strengths</h3>
          <ul style="padding-left: 20px;">
            ${feedback.strengths
              .map((s) => `<li>${s}</li>`)
              .join("")}
          </ul>
          `
              : ""
          }

          ${
            Array.isArray(feedback?.areasForImprovement) &&
            feedback.areasForImprovement.length
              ? `
          <h3 style="margin-top: 24px;">Areas for Improvement</h3>
          <ul style="padding-left: 20px;">
            ${feedback.areasForImprovement
              .map((s) => `<li>${s}</li>`)
              .join("")}
          </ul>
          `
              : ""
          }

          ${
            feedback?.finalAssessment
              ? `
          <h3 style="margin-top: 24px;">Overall Assessment</h3>
          <p style="white-space: pre-line;">${feedback.finalAssessment}</p>
          `
              : ""
          }

          <p style="margin-top: 32px; font-size: 12px; color: #6b7280;">
            You received this email because you completed a mock interview in HireReady AI.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending feedback email:", error);
    return { success: false, error: error.message };
  }
}
