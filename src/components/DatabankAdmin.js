"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = "/api/admin/databank/questions";

const LEVEL_OPTIONS = ["entry", "junior", "mid", "senior"];
const TYPE_OPTIONS = ["technical", "behavioral", "mixed"];

const emptyForm = {
  level: "",
  techstack: "",
  type: "",
  question: "",
};

function truncate(text, max = 140) {
  const s = String(text ?? "");
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export default function DatabankAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const [modalType, setModalType] = useState(null); // "create" | "edit" | "delete"
  const [deleteId, setDeleteId] = useState(null);

  const canEdit = useMemo(() => modalType === "edit" && !!editingId, [modalType, editingId]);

  // Categorization filters
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterTechstack, setFilterTechstack] = useState("all");

  const techstackOptions = useMemo(() => {
    const set = new Set(items.map((i) => i.techstack).filter(Boolean));
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterLevel !== "all" && item.level !== filterLevel) return false;
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterTechstack !== "all" && item.techstack !== filterTechstack) return false;
      return true;
    });
  }, [items, filterLevel, filterType, filterTechstack]);

  function closeModal() {
    setModalType(null);
    setDeleteId(null);
  }

  async function loadQuestions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE, { method: "GET" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load questions");
      setItems(data.questions || []);
    } catch (e) {
      setError(e?.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create question");
      setForm(emptyForm);
      await loadQuestions();
      closeModal();
    } catch (e) {
      setError(e?.message || "Failed to create question");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingId) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update question");
      setEditingId(null);
      setEditForm(emptyForm);
      await loadQuestions();
      closeModal();
    } catch (e) {
      setError(e?.message || "Failed to update question");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    const id = deleteId;
    if (!id) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.error || "Failed to delete question");
      await loadQuestions();
      closeModal();
    } catch (e) {
      setError(e?.message || "Failed to delete question");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="max-w-5xl">
      {error && (
        <div className="bg-red-500/15 border border-red-500 text-red-200 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-dark-200/40 border border-dark-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Databank Questions</h2>
          <Button type="button" onClick={() => setModalType("create")} disabled={actionLoading}>
            Add Question
          </Button>
        </div>
      </div>

      <div className="bg-dark-200/20 border border-dark-200 rounded-xl p-4">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-primary-200">
              {loading ? "Loading..." : `${filteredItems.length} items`}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={actionLoading || loading}
                onClick={() => {
                  setFilterLevel("all");
                  setFilterType("all");
                  setFilterTechstack("all");
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Level</Label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full rounded-lg border border-dark-100 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
              >
                <option value="all">All levels</option>
                {LEVEL_OPTIONS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-lg border border-dark-100 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
              >
                <option value="all">All types</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Techstack</Label>
              <select
                value={filterTechstack}
                onChange={(e) => setFilterTechstack(e.target.value)}
                className="w-full rounded-lg border border-dark-100 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
              >
                <option value="all">All techstacks</option>
                {techstackOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-primary-200">
                <th className="py-2 pr-3">Level</th>
                <th className="py-2 pr-3">Techstack</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2">Question</th>
                <th className="py-2 pl-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id} className="border-t border-dark-200/60">
                  <td className="py-3 pr-3 text-sm">{item.level}</td>
                  <td className="py-3 pr-3 text-sm">{item.techstack}</td>
                  <td className="py-3 pr-3 text-sm">{item.type}</td>
                  <td className="py-3">
                    <div className="text-sm text-gray-200">
                      {truncate(item.question)}
                    </div>
                  </td>
                  <td className="py-3 pl-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingId(item._id);
                          setEditForm({
                            level: item.level ?? "",
                            techstack: item.techstack ?? "",
                            type: item.type ?? "",
                            question: item.question ?? "",
                          });
                          setModalType("edit");
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={actionLoading}
                        onClick={() => {
                          setDeleteId(item._id);
                          setModalType("delete");
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-300">
                    No questions match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalType && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="bg-dark-200 rounded-xl w-full max-w-2xl p-4 border border-dark-100"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {modalType === "create" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold">Create Question</h2>
                  <Button type="button" variant="secondary" onClick={closeModal} disabled={actionLoading}>
                    Close
                  </Button>
                </div>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Level</Label>
                    <select
                      value={form.level}
                      onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-dark-100 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
                    >
                      <option value="" disabled>
                        Select level
                      </option>
                      {LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Techstack</Label>
                    <Input
                      value={form.techstack}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, techstack: e.target.value }))
                      }
                      placeholder="JavaScript / React / etc"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Type</Label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-dark-100 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label>Question</Label>
                    <textarea
                      className="w-full rounded-lg border border-dark-100 bg-transparent p-3 text-black dark:text-white min-h-[120px]"
                      value={form.question}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, question: e.target.value }))
                      }
                      placeholder="Write the interview question..."
                      required
                    />
                  </div>

                  <div className="md:col-span-2 flex gap-3">
                    <Button type="submit" disabled={actionLoading} className="flex-1">
                      {actionLoading ? "Saving..." : "Add"}
                    </Button>
                    <Button type="button" variant="secondary" disabled={actionLoading} onClick={closeModal}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </>
            )}

            {modalType === "edit" && canEdit && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold">Edit Question</h2>
                  <Button type="button" variant="secondary" onClick={closeModal} disabled={actionLoading}>
                    Close
                  </Button>
                </div>
                <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Level</Label>
                    <select
                      value={editForm.level}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, level: e.target.value }))
                      }
                      required
                      className="w-full rounded-lg border border-dark-100 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
                    >
                      <option value="" disabled>
                        Select level
                      </option>
                      {LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Techstack</Label>
                    <Input
                      value={editForm.techstack}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, techstack: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Type</Label>
                    <select
                      value={editForm.type}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, type: e.target.value }))
                      }
                      required
                      className="w-full rounded-lg border border-dark-100 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label>Question</Label>
                    <textarea
                      className="w-full rounded-lg border border-dark-100 bg-transparent p-3 text-black dark:text-white min-h-[120px]"
                      value={editForm.question}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, question: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="md:col-span-2 flex gap-3">
                    <Button type="submit" disabled={actionLoading} className="flex-1">
                      {actionLoading ? "Updating..." : "Update"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={actionLoading}
                      onClick={() => {
                        setEditingId(null);
                        setEditForm(emptyForm);
                        closeModal();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </>
            )}

            {modalType === "delete" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold">Delete Question</h2>
                  <Button type="button" variant="secondary" onClick={closeModal} disabled={actionLoading}>
                    Close
                  </Button>
                </div>
                <p className="text-gray-200 mb-4">
                  Are you sure you want to delete this databank question? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button type="button" variant="destructive" disabled={actionLoading} className="flex-1" onClick={handleDelete}>
                    {actionLoading ? "Deleting..." : "Delete"}
                  </Button>
                  <Button type="button" variant="secondary" disabled={actionLoading} onClick={closeModal}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

