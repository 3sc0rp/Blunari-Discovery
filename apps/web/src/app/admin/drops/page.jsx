import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminDropsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    restaurant_id: "",
    title: "",
    description: "",
    starts_at: "",
    ends_at: "",
    capacity: 0,
    is_published: false,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-drops"],
    queryFn: async () => {
      const res = await fetch("/api/admin/drops?scope=all");
      if (!res.ok) throw new Error("Failed to load drops");
      return res.json();
    },
  });

  const items = data?.items || [];

  const resetForm = () => {
    setEditing(null);
    setForm({
      restaurant_id: "",
      title: "",
      description: "",
      starts_at: "",
      ends_at: "",
      capacity: 0,
      is_published: false,
    });
  };

  const startEdit = (it) => {
    setEditing(it.id);
    setForm({
      restaurant_id: it.restaurant_id,
      title: it.title || "",
      description: it.description || "",
      starts_at: it.starts_at ? new Date(it.starts_at).toISOString() : "",
      ends_at: it.ends_at ? new Date(it.ends_at).toISOString() : "",
      capacity: it.capacity ?? 0,
      is_published: !!it.is_published,
    });
  };

  const createMut = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-drops"] });
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/drops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-drops"] });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id) => {
      const res = await fetch("/api/admin/drops", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-drops"] });
      resetForm();
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    const payload = {
      restaurant_id: Number(form.restaurant_id),
      title: form.title,
      description: form.description || null,
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      capacity: Number(form.capacity || 0),
      is_published: !!form.is_published,
    };
    if (editing) updateMut.mutate({ id: editing, ...payload });
    else createMut.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Drops</h1>
      </div>

      {/* List */}
      <div className="rounded-lg border">
        <div className="p-3 border-b font-medium bg-gray-50">Existing</div>
        {isLoading ? (
          <div className="p-4">Loading…</div>
        ) : error ? (
          <div className="p-4 text-red-600">Failed to load</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-gray-500">No drops yet</div>
        ) : (
          <div className="divide-y">
            {items.map((it) => {
              const active =
                new Date(it.starts_at) <= new Date() &&
                new Date(it.ends_at) > new Date();
              const slotsRemaining = (it.capacity ?? 0) - (it.slots_used ?? 0);
              return (
                <div
                  key={it.id}
                  className="p-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{it.title}</div>
                    <div className="text-sm text-gray-500">
                      {it.restaurant_name} •{" "}
                      {new Date(it.starts_at).toLocaleString()} →{" "}
                      {new Date(it.ends_at).toLocaleString()}
                    </div>
                    <div className="text-sm">
                      Cap {it.capacity} • Used {it.slots_used} • Left{" "}
                      {slotsRemaining}
                    </div>
                    {active ? (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : null}
                    {it.is_published ? (
                      <span className="inline-block mt-1 ml-2 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                        Published
                      </span>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 text-sm border rounded"
                      onClick={() => startEdit(it)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1.5 text-sm border rounded text-red-600"
                      onClick={() => deleteMut.mutate(it.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit */}
      <form onSubmit={onSubmit} className="rounded-lg border p-4 space-y-3">
        <div className="font-semibold">{editing ? "Edit" : "Create"} Drop</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col text-sm">
            Restaurant ID
            <input
              className="mt-1 border rounded px-3 py-2"
              value={form.restaurant_id}
              onChange={(e) =>
                setForm({ ...form, restaurant_id: e.target.value })
              }
              placeholder="e.g. 123"
            />
          </label>
          <label className="flex flex-col text-sm">
            Title
            <input
              className="mt-1 border rounded px-3 py-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
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
            Starts At (ISO)
            <input
              className="mt-1 border rounded px-3 py-2"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              placeholder="YYYY-MM-DDTHH:MM:SSZ"
            />
          </label>
          <label className="flex flex-col text-sm">
            Ends At (ISO)
            <input
              className="mt-1 border rounded px-3 py-2"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              placeholder="YYYY-MM-DDTHH:MM:SSZ"
            />
          </label>
          <label className="flex flex-col text-sm">
            Capacity
            <input
              className="mt-1 border rounded px-3 py-2"
              type="number"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
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
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded bg-black text-white"
            type="submit"
            disabled={createMut.isLoading || updateMut.isLoading}
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
        {createMut.isError || updateMut.isError ? (
          <div className="text-red-600 text-sm">Failed to save</div>
        ) : null}
      </form>
    </div>
  );
}
