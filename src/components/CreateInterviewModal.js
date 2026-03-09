"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const DEFAULT_VALUES = {
  role: "",
  level: "Junior",
  techstack: "",
  type: "Technical",
  amount: 5,
};

const levels = ["Junior", "Mid", "Senior"];
const types = ["Technical", "Behavioral", "Mixed"];

const CreateInterviewModal = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Please sign in to create an interview.");
      return;
    }

    if (!values.role.trim() || !values.techstack.trim()) {
      toast.error("Please fill in the role and tech stack.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: values.type,
          role: values.role.trim(),
          level: values.level,
          techstack: values.techstack.trim(),
          amount: values.amount || 5,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success || !data?.interview?._id) {
        console.error("Failed to create interview:", data);
        toast.error("Failed to create interview. Please try again.");
        return;
      }

      toast.success("Interview created successfully.");
      setIsOpen(false);
      setValues(DEFAULT_VALUES);
      router.push(`/interview/${data.interview._id}`);
    } catch (error) {
      console.error("Error creating interview:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        className="btn-secondary"
        onClick={() => setIsOpen(true)}
      >
        Create via form
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-lg rounded-2xl bg-dark-200 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Create Interview (Form)
                </h3>
                <button
                  type="button"
                  className="text-sm text-gray-400 hover:text-gray-200"
                  onClick={() => !submitting && setIsOpen(false)}
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm text-gray-300">Role</label>
                  <Input
                    name="role"
                    placeholder="e.g. Frontend Developer"
                    value={values.role}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-300">Experience level</label>
                  <select
                    name="level"
                    value={values.level}
                    onChange={handleChange}
                    className="w-full rounded-md border border-dark-100 bg-dark-100 px-3 py-2 text-sm outline-none"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-300">Tech stack</label>
                  <Input
                    name="techstack"
                    placeholder="e.g. React, Next.js, Node.js"
                    value={values.techstack}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-300">Interview type</label>
                  <select
                    name="type"
                    value={values.type}
                    onChange={handleChange}
                    className="w-full rounded-md border border-dark-100 bg-dark-100 px-3 py-2 text-sm outline-none"
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-300">
                    Number of questions
                  </label>
                  <Input
                    name="amount"
                    type="number"
                    min={1}
                    max={20}
                    value={values.amount}
                    onChange={handleChange}
                  />
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="btn-secondary"
                    disabled={submitting}
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? "Creating..." : "Create interview"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CreateInterviewModal;

