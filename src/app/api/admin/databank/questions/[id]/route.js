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

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isAdminUser(user)) return Response.json({ success: false, error: "Forbidden" }, { status: 403 });

  await dbConnect();

  const { id } = await params;
  const body = await request.json();

  const updates = {};
  if (body?.level !== undefined) updates.level = String(body.level).trim();
  if (body?.techstack !== undefined) updates.techstack = String(body.techstack).trim();
  if (body?.type !== undefined) updates.type = String(body.type).trim();
  if (body?.question !== undefined) updates.question = String(body.question).trim();

  const updated = await DatabankQuestion.findByIdAndUpdate(id, updates, { new: true });

  if (!updated) {
    return Response.json({ success: false, error: "Not found" }, { status: 404 });
  }

  await questionIndexer.reload();

  return Response.json(
    { success: true, question: { ...updated.toObject(), _id: String(updated._id) } },
    { status: 200 }
  );
}

export async function DELETE(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isAdminUser(user)) return Response.json({ success: false, error: "Forbidden" }, { status: 403 });

  await dbConnect();

  const { id } = await params;
  const deleted = await DatabankQuestion.findByIdAndDelete(id);

  if (!deleted) {
    return Response.json({ success: false, error: "Not found" }, { status: 404 });
  }

  await questionIndexer.reload();

  return Response.json({ success: true }, { status: 200 });
}

