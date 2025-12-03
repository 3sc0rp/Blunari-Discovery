import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminTrailsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    is_published: false,
    badge_id: "",
  });
  const [selectedTrailId, setSelectedTrailId] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-trails"],
    queryFn: async () => {
      const res = await fetch("/api/admin/trails?includeSteps=true");
      if (!res.ok) throw new Error("Failed to load trails");
      return res.json();
    },
  });
  const trails = data?.items || [];

  const resetForm = () => {
    setEditing(null);
    setForm({
      title: "",
      slug: "",
      description: "",
      is_published: false,
      badge_id: "",
    });
  };

  const startEdit = (t) => {
    setEditing(t.id);
    setForm({
      title: t.title || "",
      slug: t.slug || "",
      description: t.description || "",
      is_published: !!t.is_published,
      badge_id: t.badge_id ?? "",
    });
    setSelectedTrailId(t.id);
  };

  const saveTrail = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/trails", {
        method: payload.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-trails"] });
      resetForm();
    },
  });

  const deleteTrail = useMutation({
    mutationFn: async (id) => {
      const res = await fetch("/api/admin/trails", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-trails"] });
      if (selectedTrailId === editing) setSelectedTrailId(null);
      resetForm();
    },
  });

  // Steps management
  const steps = useMemo(
    () => trails.find((t) => t.id === selectedTrailId)?.steps || [],
    [trails, selectedTrailId],
  );

  const addStep = useMutation({
    mutationFn: async ({ trail_id, restaurant_id }) => {
      const res = await fetch("/api/admin/trails/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trail_id, restaurant_id }),
      });
      if (!res.ok) throw new Error("Add step failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-trails"] }),
  });

  const updateStep = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/trails/steps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update step failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-trails"] }),
  });

  const deleteStep = useMutation({
    mutationFn: async (id) => {
      const res = await fetch("/api/admin/trails/steps", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete step failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-trails"] }),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      slug: form.slug,
      description: form.description || null,
      is_published: !!form.is_published,
      badge_id: form.badge_id ? Number(form.badge_id) : null,
    };
    if (editing) saveTrail.mutate({ id: editing, ...payload });
    else saveTrail.mutate(payload);
  };

  const moveStep = (idx, dir) => {
    const step = steps[idx];
    if (!step) return;
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    const other = steps[target];
    updateStep.mutate({ id: step.id, order_index: other.order_index });
    updateStep.mutate({ id: other.id, order_index: step.order_index });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trails</h1>
      </div>

      {/* List */}
      <div className="rounded-lg border">
        <div className="p-3 border-b font-medium bg-gray-50">Existing</div>
        {isLoading ? (
          <div className="p-4">Loading…</div>
        ) : error ? (
          <div className="p-4 text-red-600">Failed to load</div>
        ) : trails.length === 0 ? (
          <div className="p-4 text-gray-500">No trails yet</div>
        ) : (
          <div className="divide-y">
            {trails.map((t) => (
              <div key={t.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-semibold">{t.title}</div>
                    <div className="text-sm text-gray-500">
                      {t.slug} • {t.step_count} steps{" "}
                      {t.is_published ? "• published" : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 text-sm border rounded"
                      onClick={() => startEdit(t)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1.5 text-sm border rounded text-red-600"
                      onClick={() => deleteTrail.mutate(t.id)}
                    >
                      Delete
                    </button>
                    <button
                      className="px-3 py-1.5 text-sm border rounded"
                      onClick={() => setSelectedTrailId(t.id)}
                    >
                      Steps
                    </button>
                  </div>
                </div>
                {/* Steps table */}
                {selectedTrailId === t.id ? (
                  <div className="mt-3 border rounded">
                    <div className="p-2 bg-gray-50 border-b flex items-center justify-between">
                      <div className="font-medium">Steps</div>
                      <AddStepInline
                        onAdd={(rid) =>
                          addStep.mutate({
                            trail_id: t.id,
                            restaurant_id: Number(rid),
                          })
                        }
                      />
                    </div>
                    <div className="divide-y">
                      {steps.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">
                          No steps yet
                        </div>
                      ) : (
                        steps.map((s, idx) => (
                          <div
                            key={s.id}
                            className="p-3 flex items-center gap-3"
                          >
                            <div className="w-10 text-sm text-gray-500">
                              {s.order_index}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">
                                {s.restaurant_name}
                              </div>
                              {s.note ? (
                                <div className="text-sm text-gray-500">
                                  {s.note}
                                </div>
                              ) : null}
                            </div>
                            <div className="flex gap-2">
                              <button
                                className="px-2 py-1 border rounded"
                                onClick={() => moveStep(idx, -1)}
                              >
                                ↑
                              </button>
                              <button
                                className="px-2 py-1 border rounded"
                                onClick={() => moveStep(idx, +1)}
                              >
                                ↓
                              </button>
                              <button
                                className="px-2 py-1 border rounded"
                                onClick={() => deleteStep.mutate(s.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit */}
      <form onSubmit={onSubmit} className="rounded-lg border p-4 space-y-3">
        <div className="font-semibold">{editing ? "Edit" : "Create"} Trail</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col text-sm">
            Title
            <input
              className="mt-1 border rounded px-3 py-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="flex flex-col text-sm">
            Slug
            <input
              className="mt-1 border rounded px-3 py-2"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </label>
          <label className="flex flex-col text-sm md:col-span-2">
            Description
            <textarea
              className="mt-1 border rounded px-3 py-2"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) =>
                setForm({ ...form, is_published: e.target.checked })
              }
            />
            Published
          </label>
          <label className="flex flex-col text-sm">
            Badge ID (optional)
            <input
              className="mt-1 border rounded px-3 py-2"
              value={form.badge_id}
              onChange={(e) => setForm({ ...form, badge_id: e.target.value })}
              placeholder="e.g. 3"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded bg-black text-white"
            type="submit"
            disabled={saveTrail.isLoading}
          >
            {editing ? "Save" : "Create"}
          </button>
          {editing ? (
            <button
              className="px-4 py-2 rounded border"
              type="button"
              onClick={resetForm}
            >
              Cancel
            </button>
          ) : null}
        </div>
        {saveTrail.isError ? (
          <div className="text-red-600 text-sm">Failed to save</div>
        ) : null}
      </form>
    </div>
  );
}

function AddStepInline({ onAdd }) {
  const [rid, setRid] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        className="border rounded px-2 py-1 text-sm"
        placeholder="Restaurant ID"
        value={rid}
        onChange={(e) => setRid(e.target.value)}
      />
      <button
        className="px-2 py-1 border rounded text-sm"
        onClick={() => rid && onAdd(rid)}
      >
        Add
      </button>
    </div>
  );
}
