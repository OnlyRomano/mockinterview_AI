import { verifyEmail } from "@/lib/actions/auth.actions";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const verificationToken = searchParams.get("token");

    if (!email || !verificationToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing email or verification token",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await verifyEmail({ email, verificationToken });
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in verify email API:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to verify email. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
