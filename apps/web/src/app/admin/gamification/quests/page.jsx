"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminQuestsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    slug: "",
    name: "",
    kind: "checkins",
    target: 5,
    active: true,
    rules: "{}",
  });
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "quests", { search }],
    queryFn: async () => {
      const url = new URL("/api/admin/quests", window.location.origin);
      if (search) url.searchParams.set("search", search);
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(
          `When fetching /api/admin/quests, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(
          `Create quest failed [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "quests"] }),
    onError: (e) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/quests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(
          `Update quest failed [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "quests"] }),
    onError: (e) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch("/api/admin/quests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        throw new Error(
          `Delete quest failed [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "quests"] }),
    onError: (e) => setError(e.message),
  });

  const items = useMemo(() => data?.items || [], [data]);

  const onCreate = (e) => {
    e.preventDefault();
    setError(null);
    try {
      const rules = form.rules ? JSON.parse(form.rules) : null;
      createMutation.mutate({
        slug: form.slug,
        name: form.name,
        kind: form.kind,
        target: Number(form.target),
        active: !!form.active,
        rules,
      });
    } catch (err) {
      setError("Rules must be valid JSON");
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Quests</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quests"
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
          <label className="text-sm text-gray-600">Kind</label>
          <select
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="checkins">checkins</option>
            <option value="favorites">favorites</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600">Target</label>
          <input
            type="number"
            min={1}
            value={form.target}
            onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
            className="border px-3 py-2 rounded w-full"
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
        <div className="md:col-span-3">
          <label className="text-sm text-gray-600">Rules (JSON)</label>
          <textarea
            value={form.rules}
            onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
            rows={4}
            className="border px-3 py-2 rounded w-full font-mono text-sm"
          />
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
              <th className="px-3 py-2">Kind</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Active</th>
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
                  No quests yet
                </td>
              </tr>
            ) : (
              items.map((q) => (
                <tr key={q.id} className="border-t">
                  <td className="px-3 py-2">{q.id}</td>
                  <td className="px-3 py-2">{q.slug}</td>
                  <td className="px-3 py-2">{q.name}</td>
                  <td className="px-3 py-2">{q.kind}</td>
                  <td className="px-3 py-2">{q.target}</td>
                  <td className="px-3 py-2">{q.active ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() =>
                        updateMutation.mutate({ id: q.id, active: !q.active })
                      }
                      className="px-3 py-1 rounded border mr-2"
                    >
                      {q.active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(q.id)}
                      className="px-3 py-1 rounded border text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
