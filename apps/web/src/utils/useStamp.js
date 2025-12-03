import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function useStamp() {
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/blunari/stamps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Stamp failed [${res.status}] ${res.statusText} ${text}`,
        );
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.firstTime) {
        const details = [];
        if (typeof data?.xp === "number" && typeof data?.level === "number") {
          details.push(`+10 XP${data?.justLeveledUp ? " • Level up!" : ""}`);
        } else {
          details.push("+10 XP (first time)");
        }
        toast.success("Marked visited", { description: details.join(" ") });
        const newBadges = Array.isArray(data?.newlyEarnedBadges)
          ? data.newlyEarnedBadges
          : [];
        if (newBadges.length > 0) {
          const names = newBadges
            .map((b) => b?.name || b?.slug)
            .filter(Boolean)
            .join(", ");
          toast.success("New badge", { description: names });
        }
      } else {
        toast.info("Already marked visited");
      }
    },
    onError: (err) => {
      console.error(err);
      toast.error("Could not mark visited");
    },
  });

  const markVisited = (payload) => mutation.mutate(payload);

  return { markVisited, loading: mutation.isLoading };
}
