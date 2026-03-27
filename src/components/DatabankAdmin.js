"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderTwo } from "@/components/ui/loader";

const API_BASE = "/api/admin/databank/questions";

const LEVEL_OPTIONS = ["entry", "junior", "mid", "senior"];
const TYPE_OPTIONS = ["technical", "behavioral", "mixed"];
const PAGE_SIZE = 5;

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
  const [page, setPage] = useState(1);

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

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  }, [filteredItems.length]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  useEffect(() => {
    setPage(1);
  }, [filterLevel, filterType, filterTechstack]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center gap-3">
          <LoaderTwo />
          <p className="text-primary-foreground font-semibold">Loading databank questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-foreground p-4 rounded-2xl mb-4">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-3xl p-4 mb-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Databank Questions</h2>
          <Button type="button" onClick={() => setModalType("create")} disabled={actionLoading}>
            Add Question
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-4 shadow-[var(--shadow-sm)]">
            <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-primary-foreground">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderTwo /> Loading...
                </span>
              ) : (
                `Showing ${pageItems.length} of ${filteredItems.length} • Page ${page} of ${totalPages}`
              )}
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
                  setPage(1);
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
                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
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
                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
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
                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
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
              <tr className="text-sm text-primary-foreground">
                <th className="py-2 pr-3">Level</th>
                <th className="py-2 pr-3">Techstack</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2">Question</th>
                <th className="py-2 pl-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-700">
                    <div className="flex items-center justify-center gap-3">
                      <LoaderTwo />
                      Loading databank questions...
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {pageItems.map((item) => (
                    <tr key={item._id} className="border-t border-border">
                      <td className="py-3 pr-3 text-sm">{item.level}</td>
                      <td className="py-3 pr-3 text-sm">{item.techstack}</td>
                      <td className="py-3 pr-3 text-sm">{item.type}</td>
                      <td className="py-3">
                        <div className="text-sm text-muted-foreground">
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
                  {filteredItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-gray-600"
                      >
                        No questions match the selected filters.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between gap-4 mt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1 || actionLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <div className="text-sm text-primary-foreground">
              Page {page} of {totalPages}
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= totalPages || actionLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {modalType && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="bg-white rounded-xl w-full max-w-2xl p-4 border border-gray-200"
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
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
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
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
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
                      className="w-full rounded-lg border border-gray-200 bg-transparent p-3 text-black dark:text-white min-h-[120px]"
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
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
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
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-black dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
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
                      className="w-full rounded-lg border border-gray-200 bg-transparent p-3 text-black dark:text-white min-h-[120px]"
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
                <p className="text-gray-700 mb-4">
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

