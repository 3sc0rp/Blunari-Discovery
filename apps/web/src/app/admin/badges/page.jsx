import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminBadgesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    icon: "",
    active: true,
    thresholds: "",
  });
  const [editing, setEditing] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-badges"],
    queryFn: async () => {
      const res = await fetch("/api/admin/badges");
      if (!res.ok) throw new Error("Failed to load badges");
      return res.json();
    },
  });
  const items = data?.items || [];

  const saveMut = useMutation({
    mutationFn: async (payload) => {
      const method = editing ? "PATCH" : "POST";
      const res = await fetch("/api/admin/badges", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-badges"] });
      setEditing(null);
      setForm({
        slug: "",
        name: "",
        description: "",
        icon: "",
        active: true,
        thresholds: "",
      });
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    const payload = {
      slug: form.slug,
      name: form.name,
      description: form.description || null,
      icon: form.icon || null,
      active: !!form.active,
      thresholds: form.thresholds ? form.thresholds : null,
    };
    if (editing) saveMut.mutate({ id: editing, ...payload });
    else saveMut.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Badges</h1>

      <div className="rounded-lg border">
        <div className="p-3 border-b font-medium bg-gray-50">Existing</div>
        {isLoading ? (
          <div className="p-4">Loading…</div>
        ) : error ? (
          <div className="p-4 text-red-600">Failed to load</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-gray-500">No badges yet</div>
        ) : (
          <div className="divide-y">
            {items.map((b) => (
              <div key={b.id} className="p-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-semibold">{b.name}</div>
                  <div className="text-sm text-gray-500">
                    {b.slug} {b.active ? "• active" : "• inactive"}
                  </div>
                </div>
                <button
                  className="px-3 py-1.5 text-sm border rounded"
                  onClick={() => {
                    setEditing(b.id);
                    setForm({
                      slug: b.slug,
                      name: b.name,
                      description: b.description || "",
                      icon: b.icon || "",
                      active: !!b.active,
                      thresholds: b.thresholds
                        ? JSON.stringify(b.thresholds)
                        : "",
                    });
                  }}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="rounded-lg border p-4 space-y-3">
        <div className="font-semibold">{editing ? "Edit" : "Create"} Badge</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col text-sm">
            Slug
            <input
              className="mt-1 border rounded px-3 py-2"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </label>
          <label className="flex flex-col text-sm">
            Name
            <input
              className="mt-1 border rounded px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
          <label className="flex flex-col text-sm">
            Icon URL
            <input
              className="mt-1 border rounded px-3 py-2"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
          </label>
          <label className="flex flex-col text-sm md:col-span-2">
            Thresholds (JSON)
            <textarea
              className="mt-1 border rounded px-3 py-2"
              rows={3}
              placeholder='{"checkins": 1}'
              value={form.thresholds}
              onChange={(e) => setForm({ ...form, thresholds: e.target.value })}
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active
          </label>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded bg-black text-white"
            type="submit"
            disabled={saveMut.isLoading}
          >
            {editing ? "Save" : "Create"}
          </button>
          {editing ? (
            <button
              className="px-4 py-2 rounded border"
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({
                  slug: "",
                  name: "",
                  description: "",
                  icon: "",
                  active: true,
                  thresholds: "",
                });
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
        {saveMut.isError ? (
          <div className="text-red-600 text-sm">Failed to save</div>
        ) : null}
      </form>
    </div>
  );
}
