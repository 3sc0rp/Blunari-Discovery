import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function CitySelect({ value, onChange }) {
  const { data } = useQuery({
    queryKey: ["admin-cities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cities");
      if (!res.ok) throw new Error("failed cities");
      return res.json();
    },
  });
  const cities = data?.cities || [];
  return (
    <select
      className="border rounded px-2 py-1"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">All cities</option>
      {cities.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

export default function AdminLists() {
  const qc = useQueryClient();
  const [cityId, setCityId] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-lists", cityId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (cityId) params.set("city_id", cityId);
      const res = await fetch(`/api/admin/lists?${params.toString()}`);
      if (!res.ok) throw new Error("load lists failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("create failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-lists"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/lists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("update failed");
      return res.json();
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-lists"] });
      qc.invalidateQueries({ queryKey: ["admin-list-entries", vars?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/admin/lists?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-lists"] }),
  });

  const [form, setForm] = useState({
    city_id: "",
    slug: "",
    title: "",
    published: false,
  });

  const lists = data?.lists || [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Curated Lists</h1>

      <div className="flex items-center gap-2">
        <label className="text-sm">City</label>
        <CitySelect value={cityId} onChange={setCityId} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.city_id || !form.slug || !form.title) return;
          createMutation.mutate({ ...form, city_id: Number(form.city_id) });
        }}
        className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end"
      >
        <div className="md:col-span-2">
          <label className="block text-sm">City</label>
          <CitySelect
            value={form.city_id}
            onChange={(v) => setForm({ ...form, city_id: v })}
          />
        </div>
        <div>
          <label className="block text-sm">Slug</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm">Title</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />{" "}
          Published
        </label>
        <button
          className="bg-black text-white rounded px-3 py-2"
          type="submit"
          disabled={createMutation.isLoading}
        >
          Create
        </button>
      </form>

      {isLoading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="text-red-500">{String(error.message || error)}</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 border text-left">ID</th>
                <th className="p-2 border text-left">Title</th>
                <th className="p-2 border text-left">Slug</th>
                <th className="p-2 border text-left">City</th>
                <th className="p-2 border text-left">Published</th>
                <th className="p-2 border text-left">Entries</th>
                <th className="p-2 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((l) => (
                <ListRow
                  key={l.id}
                  l={l}
                  onUpdate={(patch) =>
                    updateMutation.mutate({ id: l.id, ...patch })
                  }
                  onDelete={() => deleteMutation.mutate(l.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ListRow({ l, onUpdate, onDelete }) {
  const [expand, setExpand] = useState(false);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["admin-list-entries", l.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/lists/${l.id}/entries`);
      if (!res.ok) throw new Error("entries failed");
      return res.json();
    },
  });

  const addEntry = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/admin/lists/${l.id}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("add failed");
      return res.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-list-entries", l.id] }),
  });

  const updateEntry = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/admin/lists/${l.id}/entries`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("update failed");
      return res.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-list-entries", l.id] }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (entry_id) => {
      const res = await fetch(
        `/api/admin/lists/${l.id}/entries?entry_id=${entry_id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("delete failed");
      return res.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-list-entries", l.id] }),
  });

  const entries = data?.entries || [];

  const [newEntry, setNewEntry] = useState({
    restaurant_id: "",
    position: entries.length + 1,
  });

  return (
    <tr className="border-t align-top">
      <td className="p-2 border">{l.id}</td>
      <td className="p-2 border">
        <input
          className="border rounded px-2 py-1 w-full"
          defaultValue={l.title}
          onBlur={(e) => onUpdate({ title: e.target.value })}
        />
      </td>
      <td className="p-2 border">
        <input
          className="border rounded px-2 py-1 w-full"
          defaultValue={l.slug}
          onBlur={(e) => onUpdate({ slug: e.target.value })}
        />
      </td>
      <td className="p-2 border">{l.city_id}</td>
      <td className="p-2 border">
        <input
          type="checkbox"
          defaultChecked={l.published}
          onChange={(e) => onUpdate({ published: e.target.checked })}
        />
      </td>
      <td className="p-2 border">
        <button
          className="text-blue-600 underline"
          onClick={() => setExpand((v) => !v)}
        >
          {expand ? "Hide" : "Manage"}
        </button>
        {expand ? (
          <div className="mt-2 space-y-2">
            <form
              className="flex gap-2 items-end"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newEntry.restaurant_id) return;
                addEntry.mutate({
                  restaurant_id: Number(newEntry.restaurant_id),
                  position: Number(newEntry.position) || 1,
                });
              }}
            >
              <div>
                <label className="block text-xs">Restaurant ID</label>
                <input
                  className="border rounded px-2 py-1 w-40"
                  value={newEntry.restaurant_id}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, restaurant_id: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs">Position</label>
                <input
                  className="border rounded px-2 py-1 w-24"
                  value={newEntry.position}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, position: e.target.value })
                  }
                />
              </div>
              <button
                className="bg-black text-white rounded px-2 py-1 text-sm"
                type="submit"
              >
                Add
              </button>
            </form>
            <ol className="space-y-1">
              {entries.map((en) => (
                <li key={en.id} className="flex items-center gap-2">
                  <span className="text-xs w-6">{en.position}</span>
                  <span className="text-xs">#{en.restaurant_id}</span>
                  <button
                    className="text-blue-600 text-xs"
                    onClick={() =>
                      updateEntry.mutate({
                        entry_id: en.id,
                        position: en.position + 1,
                      })
                    }
                  >
                    + pos
                  </button>
                  <button
                    className="text-blue-600 text-xs"
                    onClick={() =>
                      updateEntry.mutate({
                        entry_id: en.id,
                        position: Math.max(1, en.position - 1),
                      })
                    }
                  >
                    - pos
                  </button>
                  <button
                    className="text-red-600 text-xs"
                    onClick={() => deleteEntry.mutate(en.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </td>
      <td className="p-2 border">
        <button className="text-red-600" onClick={onDelete}>
          Delete
        </button>
      </td>
    </tr>
  );
}
