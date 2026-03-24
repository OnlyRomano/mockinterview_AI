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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendInterviewFeedbackEmail({
  email,
  userName,
  role,
  feedback,
  appUrl,
  interviewId,
}) {
  try {
    const feedbackLink =
      appUrl && interviewId ? `${appUrl}/interview/${interviewId}/feedback` : null;

    const categories = Array.isArray(feedback?.categoryScore)
      ? feedback.categoryScore
      : [];
    const primaryCategories = categories.filter(
      (category) => category?.name !== "Face Detection"
    );
    const faceDetectionCategories = categories.filter(
      (category) => category?.name === "Face Detection"
    );

    const categoryRows = primaryCategories.length
      ? feedback.categoryScore
          .map(
            (category) =>
              `<div style="background:#161B2E;border:1px solid #2A3252;border-radius:12px;padding:12px 14px;margin-bottom:10px;">
                <p style="margin:0 0 6px 0;color:#E6EBFF;font-weight:700;">${escapeHtml(category?.name)} (${escapeHtml(category?.score)}/100)</p>
                <p style="margin:0;color:#B8C0DF;line-height:1.6;">${escapeHtml(category?.comment)}</p>
              </div>`
          )
          .join("")
      : '<p style="margin:0;color:#B8C0DF;">No category details available.</p>';

    const faceDetectionRows = faceDetectionCategories.length
      ? faceDetectionCategories
          .map(
            (category) =>
              `<div style="background:#161B2E;border:1px solid #2A3252;border-radius:12px;padding:12px 14px;margin-bottom:10px;">
                <p style="margin:0 0 6px 0;color:#E6EBFF;font-weight:700;">${escapeHtml(category?.name)} (${escapeHtml(category?.score)}/100)</p>
                <p style="margin:0;color:#B8C0DF;line-height:1.6;">${escapeHtml(category?.comment)}</p>
              </div>`
          )
          .join("")
      : "";

    const strengthsRows = Array.isArray(feedback?.strengths)
      ? feedback.strengths
          .map(
            (item) =>
              `<li style="margin-bottom:8px;color:#D6DDF7;line-height:1.6;">${escapeHtml(item)}</li>`
          )
          .join("")
      : "";

    const improvementsRows = Array.isArray(feedback?.areasForImprovement)
      ? feedback.areasForImprovement
          .map(
            (item) =>
              `<li style="margin-bottom:8px;color:#D6DDF7;line-height:1.6;">${escapeHtml(item)}</li>`
          )
          .join("")
      : "";

    const feedbackDate = feedback?.createdAt
      ? new Date(feedback.createdAt).toLocaleString()
      : "N/A";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `HireReady AI - Your ${role || "Interview"} Feedback`,
      html: `
        <div style="background:#0B1020;padding:24px;font-family:Arial,sans-serif;">
          <div style="max-width:760px;margin:0 auto;background:#0F162E;border:1px solid #253154;border-radius:18px;padding:24px;">
            <h2 style="margin:0 0 8px 0;color:#F3F6FF;">Feedback on the Interview - ${escapeHtml(role || "Interview")}</h2>
            <p style="margin:0 0 18px 0;color:#B8C0DF;">Hello ${escapeHtml(userName || "there")}, your interview feedback is ready.</p>

            <div style="background:#121A33;border:1px solid #2A3252;border-radius:12px;padding:14px 16px;margin-bottom:16px;">
              <p style="margin:0 0 6px 0;color:#D6DDF7;"><strong>Overall Impression:</strong> <span style="color:#7AD3FF;font-weight:700;">${escapeHtml(feedback?.totalScore)}/100</span></p>
              <p style="margin:0;color:#9FA8CC;"><strong>Date:</strong> ${escapeHtml(feedbackDate)}</p>
            </div>

            <hr style="border:none;border-top:1px solid #2A3252;margin:16px 0;" />

            <h3 style="color:#E6EBFF;margin:0 0 8px 0;">Final Assessment</h3>
            <p style="margin:0 0 18px 0;color:#D6DDF7;line-height:1.7;">${escapeHtml(feedback?.finalAssessment)}</p>

            <h3 style="color:#E6EBFF;margin:0 0 10px 0;">Breakdown of the Interview</h3>
            ${categoryRows}

            ${
              faceDetectionRows
                ? `<h3 style="color:#E6EBFF;margin:14px 0 10px 0;">Face Detection (Engagement)</h3>${faceDetectionRows}`
                : ""
            }

            <h3 style="color:#E6EBFF;margin:18px 0 10px 0;">Strengths</h3>
            <ul style="padding-left:20px;margin:0 0 10px 0;">${strengthsRows || '<li style="color:#B8C0DF;">No strengths listed.</li>'}</ul>

            <h3 style="color:#E6EBFF;margin:14px 0 10px 0;">Areas for Improvement</h3>
            <ul style="padding-left:20px;margin:0 0 16px 0;">${improvementsRows || '<li style="color:#B8C0DF;">No areas listed.</li>'}</ul>

            ${
              feedbackLink
                ? `<p style="margin:0 0 8px 0;"><a href="${feedbackLink}" style="background:#7AD3FF;color:#081125;padding:10px 18px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;">View Feedback in App</a></p>`
                : ""
            }
            <p style="margin:12px 0 0 0;color:#9FA8CC;">Keep practicing - you are making progress.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending interview feedback email:", error);
    return { success: false, error: error.message };
  }
}
