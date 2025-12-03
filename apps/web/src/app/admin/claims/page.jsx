import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function AdminClaims() {
  const [status, setStatus] = useState("");
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-claims", status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/claims?${params.toString()}`);
      if (!res.ok) throw new Error("load claims failed");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("update failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-claims"] }),
  });

  if (isLoading) return <div>Loading…</div>;
  if (error)
    return <div className="text-red-500">{String(error.message || error)}</div>;

  const claims = data?.claims || [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Claims</h1>
      <div className="flex items-center gap-2">
        <label className="text-sm">Status</label>
        <select
          className="border rounded px-2 py-1"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border text-left">ID</th>
              <th className="p-2 border text-left">Restaurant ID</th>
              <th className="p-2 border text-left">Name</th>
              <th className="p-2 border text-left">Email</th>
              <th className="p-2 border text-left">Message</th>
              <th className="p-2 border text-left">Status</th>
              <th className="p-2 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2 border">{c.id}</td>
                <td className="p-2 border">{c.restaurant_id}</td>
                <td className="p-2 border">{c.name}</td>
                <td className="p-2 border">{c.email}</td>
                <td
                  className="p-2 border max-w-[300px] truncate"
                  title={c.message || ""}
                >
                  {c.message}
                </td>
                <td className="p-2 border">{c.status}</td>
                <td className="p-2 border">
                  <button
                    className="text-green-700 mr-2"
                    onClick={() =>
                      updateMutation.mutate({ id: c.id, status: "approved" })
                    }
                  >
                    Approve
                  </button>
                  <button
                    className="text-red-700"
                    onClick={() =>
                      updateMutation.mutate({ id: c.id, status: "rejected" })
                    }
                  >
                    Reject
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
