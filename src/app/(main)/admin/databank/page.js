import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import DatabankAdmin from "@/components/DatabankAdmin";

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

const page = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!isAdminUser(user)) redirect("/");

  return (
    <div className="p-4">
      <DatabankAdmin />
    </div>
  );
};

export default page;

