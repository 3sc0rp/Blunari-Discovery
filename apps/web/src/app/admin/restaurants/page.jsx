import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useSupabaseImageUpload from "@/utils/useSupabaseImageUpload";

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

export default function AdminRestaurants() {
  const qc = useQueryClient();
  const [cityId, setCityId] = useState("");
  const [q, setQ] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-restaurants", cityId, q],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (cityId) params.set("city_id", cityId);
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/restaurants?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load restaurants");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-restaurants"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/restaurants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
      qc.invalidateQueries({ queryKey: ["admin-restaurant-images", vars?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/admin/restaurants?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-restaurants"] }),
  });

  const [form, setForm] = useState({
    city_id: "",
    slug: "",
    name: "",
    published: false,
  });

  const restaurants = data?.restaurants || [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Restaurants</h1>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex items-center gap-2">
          <label className="text-sm">City</label>
          <CitySelect value={cityId} onChange={setCityId} />
        </div>
        <div>
          <label className="block text-sm">Search</label>
          <input
            className="border rounded px-2 py-1"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name contains..."
          />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.city_id || !form.slug || !form.name) return;
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
          <label className="block text-sm">Name</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                <th className="p-2 border text-left">Name</th>
                <th className="p-2 border text-left">Slug</th>
                <th className="p-2 border text-left">City</th>
                <th className="p-2 border text-left">Published</th>
                <th className="p-2 border text-left">Images</th>
                <th className="p-2 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <RestaurantRow
                  key={r.id}
                  r={r}
                  onUpdate={(patch) =>
                    updateMutation.mutate({ id: r.id, ...patch })
                  }
                  onDelete={() => deleteMutation.mutate(r.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RestaurantRow({ r, onUpdate, onDelete }) {
  const [expand, setExpand] = useState(false);
  const [uploadImage, { loading: uploading, error: uploadError }] =
    useSupabaseImageUpload();
  const qc = useQueryClient();

  const { data: imagesData } = useQuery({
    queryKey: ["admin-restaurant-images", r.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/restaurants/${r.id}/images`);
      if (!res.ok) throw new Error("load images failed");
      return res.json();
    },
  });

  const addImage = useMutation({
    mutationFn: async ({ path, mime }) => {
      const res = await fetch(`/api/admin/restaurants/${r.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, mime }),
      });
      if (!res.ok) throw new Error("add image failed");
      return res.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-restaurant-images", r.id] }),
  });

  const deleteImage = useMutation({
    mutationFn: async (image_id) => {
      const res = await fetch(
        `/api/admin/restaurants/${r.id}/images?image_id=${image_id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("delete failed");
      return res.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-restaurant-images", r.id] }),
  });

  return (
    <tr className="border-t align-top">
      <td className="p-2 border">{r.id}</td>
      <td className="p-2 border">
        <input
          className="border rounded px-2 py-1 w-full"
          defaultValue={r.name}
          onBlur={(e) => onUpdate({ name: e.target.value })}
        />
      </td>
      <td className="p-2 border">
        <input
          className="border rounded px-2 py-1 w-full"
          defaultValue={r.slug}
          onBlur={(e) => onUpdate({ slug: e.target.value })}
        />
      </td>
      <td className="p-2 border">{r.city_id}</td>
      <td className="p-2 border">
        <input
          type="checkbox"
          defaultChecked={r.published}
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
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const { path, error } = await uploadImage(file);
                if (error) return;
                addImage.mutate({ path, mime: file.type });
                e.target.value = "";
              }}
            />
            {uploadError ? (
              <div className="text-red-500 text-xs">{uploadError}</div>
            ) : null}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(imagesData?.images || []).map((img) => (
                <div key={img.id} className="border rounded p-2">
                  <div className="text-xs text-gray-500 line-clamp-1">
                    {img.path}
                  </div>
                  <button
                    className="text-red-600 text-xs"
                    onClick={() => deleteImage.mutate(img.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
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
