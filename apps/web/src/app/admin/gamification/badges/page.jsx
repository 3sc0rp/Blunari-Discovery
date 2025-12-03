"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminBadgesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    slug: "",
    name: "",
    icon: "",
    active: true,
    thresholds: '{\n  "checkins": 10\n}',
  });
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "badges", { search }],
    queryFn: async () => {
      const url = new URL("/api/admin/badges", window.location.origin);
      if (search) url.searchParams.set("search", search);
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(
          `When fetching /api/admin/badges, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(
          `Create badge failed [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "badges"] }),
    onError: (e) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/badges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(
          `Update badge failed [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "badges"] }),
    onError: (e) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch("/api/admin/badges", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        throw new Error(
          `Delete badge failed [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "badges"] }),
    onError: (e) => setError(e.message),
  });

  const items = useMemo(() => data?.items || [], [data]);

  const onCreate = (e) => {
    e.preventDefault();
    setError(null);
    try {
      const thresholds = form.thresholds ? JSON.parse(form.thresholds) : null;
      createMutation.mutate({ ...form, thresholds });
    } catch (err) {
      setError("Thresholds must be valid JSON");
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Badges</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search badges"
          className="border px-3 py-2 rounded w-[220px]"
        />
      </div>

      {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

      <form
        onSubmit={onCreate}
        className="border rounded p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 bg-white"
      >
        <div>
          <label className="text-sm text-gray-600">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Icon (emoji or URL)</label>
          <input
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        <div className="md:col-span-3">
          <label className="text-sm text-gray-600">Thresholds (JSON)</label>
          <textarea
            value={form.thresholds}
            onChange={(e) =>
              setForm((f) => ({ ...f, thresholds: e.target.value }))
            }
            rows={4}
            className="border px-3 py-2 rounded w-full font-mono text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="active"
            type="checkbox"
            checked={!!form.active}
            onChange={(e) =>
              setForm((f) => ({ ...f, active: e.target.checked }))
            }
          />
          <label htmlFor="active">Active</label>
        </div>
        <div className="md:col-span-3 flex justify-end">
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? "Creating…" : "Create / Upsert"}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto bg-white border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Icon</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Thresholds</th>
              <th className="px-3 py-2 w-[120px]"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-3 py-6" colSpan={7}>
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-3 py-6" colSpan={7}>
                  No badges yet
                </td>
              </tr>
            ) : (
              items.map((b) => {
                const [local, setLocal] = [b, (next) => {}]; // placeholder to avoid complex local state per row
                return (
                  <tr key={b.id} className="border-t">
                    <td className="px-3 py-2">{b.id}</td>
                    <td className="px-3 py-2">{b.slug}</td>
                    <td className="px-3 py-2">{b.name}</td>
                    <td className="px-3 py-2">{b.icon}</td>
                    <td className="px-3 py-2">{b.active ? "Yes" : "No"}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[360px] truncate">
                      {b.thresholds ? JSON.stringify(b.thresholds) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() =>
                          updateMutation.mutate({ id: b.id, active: !b.active })
                        }
                        className="px-3 py-1 rounded border mr-2"
                      >
                        {b.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(b.id)}
                        className="px-3 py-1 rounded border text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
