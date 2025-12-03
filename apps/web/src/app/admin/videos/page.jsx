import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminVideosPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    restaurant_id: "",
    uploader_user_id: "",
    video_url: "",
    caption: "",
    is_published: false,
  });
  const [editing, setEditing] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: async () => {
      const res = await fetch("/api/admin/videos");
      if (!res.ok) throw new Error("Failed to load videos");
      return res.json();
    },
  });
  const items = data?.items || [];

  const saveMut = useMutation({
    mutationFn: async (payload) => {
      const method = payload.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/videos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-videos"] });
      setEditing(null);
      setForm({
        restaurant_id: "",
        uploader_user_id: "",
        video_url: "",
        caption: "",
        is_published: false,
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id) => {
      const res = await fetch("/api/admin/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-videos"] }),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    const payload = {
      restaurant_id: Number(form.restaurant_id),
      uploader_user_id: form.uploader_user_id || null,
      video_url: form.video_url,
      caption: form.caption || null,
      is_published: !!form.is_published,
    };
    if (editing) saveMut.mutate({ id: editing, ...payload });
    else saveMut.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Videos</h1>

      <div className="rounded-lg border">
        <div className="p-3 border-b font-medium bg-gray-50">Existing</div>
        {isLoading ? (
          <div className="p-4">Loading…</div>
        ) : error ? (
          <div className="p-4 text-red-600">Failed to load</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-gray-500">No videos yet</div>
        ) : (
          <div className="divide-y">
            {items.map((v) => (
              <div key={v.id} className="p-3 flex items-center gap-3">
                <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                  Video
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{v.caption || "Untitled"}</div>
                  <div className="text-sm text-gray-500">
                    {v.restaurant_name} •{" "}
                    {new Date(v.created_at).toLocaleString()}
                  </div>
                  <div className="text-sm">
                    Likes {v.likes} • Views {v.views}
                  </div>
                  {v.is_published ? (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      Published
                    </span>
                  ) : (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 text-sm border rounded"
                    onClick={() => {
                      setEditing(v.id);
                      setForm({
                        restaurant_id: v.restaurant_id,
                        uploader_user_id: v.uploader_user_id || "",
                        video_url: v.video_url,
                        caption: v.caption || "",
                        is_published: !!v.is_published,
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1.5 text-sm border rounded text-red-600"
                    onClick={() => deleteMut.mutate(v.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="rounded-lg border p-4 space-y-3">
        <div className="font-semibold">{editing ? "Edit" : "Create"} Video</div>
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
            Uploader User ID (optional)
            <input
              className="mt-1 border rounded px-3 py-2"
              value={form.uploader_user_id}
              onChange={(e) =>
                setForm({ ...form, uploader_user_id: e.target.value })
              }
            />
          </label>
          <label className="flex flex-col text-sm md:col-span-2">
            Video URL
            <input
              className="mt-1 border rounded px-3 py-2"
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://…"
            />
          </label>
          <label className="flex flex-col text-sm md:col-span-2">
            Caption
            <textarea
              className="mt-1 border rounded px-3 py-2"
              rows={2}
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
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
                  restaurant_id: "",
                  uploader_user_id: "",
                  video_url: "",
                  caption: "",
                  is_published: false,
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
