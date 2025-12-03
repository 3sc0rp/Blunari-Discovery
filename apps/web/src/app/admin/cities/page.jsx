import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminCities() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-cities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cities");
      if (!res.ok) throw new Error("Failed to load cities");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cities"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/cities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cities"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/admin/cities?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cities"] }),
  });

  const [form, setForm] = useState({ country: "us", city: "", name: "" });

  if (isLoading) return <div>Loading...</div>;
  if (error)
    return <div className="text-red-500">{String(error.message || error)}</div>;

  const cities = data?.cities || [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Cities</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.city || !form.name) return;
          createMutation.mutate(form);
        }}
        className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end"
      >
        <div>
          <label className="block text-sm">Country</label>
          <input
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm">City code</label>
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <button
          className="bg-black text-white rounded px-3 py-2"
          type="submit"
          disabled={createMutation.isLoading}
        >
          Add
        </button>
      </form>

      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2 border">ID</th>
            <th className="text-left p-2 border">Country</th>
            <th className="text-left p-2 border">City</th>
            <th className="text-left p-2 border">Name</th>
            <th className="text-left p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cities.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-2 border">{c.id}</td>
              <td className="p-2 border">
                <input
                  className="border rounded px-2 py-1"
                  defaultValue={c.country}
                  onBlur={(e) =>
                    updateMutation.mutate({ id: c.id, country: e.target.value })
                  }
                />
              </td>
              <td className="p-2 border">
                <input
                  className="border rounded px-2 py-1"
                  defaultValue={c.city}
                  onBlur={(e) =>
                    updateMutation.mutate({ id: c.id, city: e.target.value })
                  }
                />
              </td>
              <td className="p-2 border">
                <input
                  className="border rounded px-2 py-1"
                  defaultValue={c.name}
                  onBlur={(e) =>
                    updateMutation.mutate({ id: c.id, name: e.target.value })
                  }
                />
              </td>
              <td className="p-2 border">
                <button
                  onClick={() => deleteMutation.mutate(c.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
