import Agent from "@/components/Agent";
import CreateInterviewModal from "@/components/CreateInterviewModal";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import React from "react";

const page = async () => {
  const user = await getCurrentUser();

  return (
    <>
      <div className="flex flex-col gap-3 mb-6 max-sm:mb-4">
        <h3>Interview Generation</h3>
        <p className="text-sm text-gray-300 max-w-xl">
          You can either talk to the AI to have it generate an interview for
          you, or quickly fill in a form to create one instantly.
        </p>
        <div className="flex flex-wrap gap-3">
          <CreateInterviewModal userId={user?.id} />
        </div>
      </div>

      <Agent userName={user?.name} userId={user?.id} type="generate" />
    </>
  );
};

export default page;