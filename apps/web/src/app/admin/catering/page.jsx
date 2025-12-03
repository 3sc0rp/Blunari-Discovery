import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function AdminCatering() {
  const [status, setStatus] = useState("");
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-catering", status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/catering?${params.toString()}`);
      if (!res.ok) throw new Error("load catering failed");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/catering", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("update failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-catering"] }),
  });

  if (isLoading) return <div>Loading…</div>;
  if (error)
    return <div className="text-red-500">{String(error.message || error)}</div>;

  const requests = data?.requests || [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Catering Requests</h1>
      <div className="flex items-center gap-2">
        <label className="text-sm">Status</label>
        <select
          className="border rounded px-2 py-1"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="new">New</option>
          <option value="in_review">In Review</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border text-left">ID</th>
              <th className="p-2 border text-left">Name</th>
              <th className="p-2 border text-left">Email</th>
              <th className="p-2 border text-left">Details</th>
              <th className="p-2 border text-left">Status</th>
              <th className="p-2 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 border">{r.id}</td>
                <td className="p-2 border">{r.name}</td>
                <td className="p-2 border">{r.email}</td>
                <td
                  className="p-2 border max-w-[320px] truncate"
                  title={JSON.stringify(r.details || {})}
                >
                  {JSON.stringify(r.details || {})}
                </td>
                <td className="p-2 border">{r.status}</td>
                <td className="p-2 border">
                  <button
                    className="text-blue-700 mr-2"
                    onClick={() =>
                      updateMutation.mutate({ id: r.id, status: "in_review" })
                    }
                  >
                    In review
                  </button>
                  <button
                    className="text-green-700"
                    onClick={() =>
                      updateMutation.mutate({ id: r.id, status: "closed" })
                    }
                  >
                    Close
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
