import { getCurrentUser } from "@/lib/actions/auth.actions";
import dbConnect from "@/lib/db";
import DatabankQuestion from "@/lib/models/DatabankQuestion";
import questionIndexer from "@/lib/databank/questionIndexer";

function isAdminUser(user) {

  const emailsRaw = process.env.DATABANK_ADMIN_EMAILS;
  if (!emailsRaw) return true; // if not configured, allow (useful for dev)

  const emails = String(emailsRaw)
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!user?.email || emails.length === 0) return false;
  return emails.includes(String(user.email).toLowerCase());
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isAdminUser(user)) return Response.json({ success: false, error: "Forbidden" }, { status: 403 });

  await dbConnect();

  const questions = await DatabankQuestion.find({})
    .sort({ createdAt: -1 })
    .lean();

  const serialized = questions.map((q) => ({
    ...q,
    _id: String(q._id),
  }));

  return Response.json({ success: true, questions: serialized }, { status: 200 });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isAdminUser(user)) return Response.json({ success: false, error: "Forbidden" }, { status: 403 });

  await dbConnect();

  const body = await request.json();
  const level = String(body?.level ?? "").trim();
  const techstack = String(body?.techstack ?? "").trim();
  const type = String(body?.type ?? "").trim();
  const question = String(body?.question ?? "").trim();

  if (!level || !techstack || !type || !question) {
    return Response.json(
      { success: false, error: "level, techstack, type, and question are required" },
      { status: 400 }
    );
  }

  const created = await DatabankQuestion.create({ level, techstack, type, question });

  // Refresh cached indexes so the generator uses the updated databank immediately.
  await questionIndexer.reload();

  return Response.json(
    { success: true, question: { ...created.toObject(), _id: String(created._id) } },
    { status: 201 }
  );
}

