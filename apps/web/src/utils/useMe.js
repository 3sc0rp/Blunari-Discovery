import { useQuery } from "@tanstack/react-query";

export default function useMe() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/me");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/me, the response was [${res.status}] ${res.statusText}`,
        );
      }
      const json = await res.json();
      return json?.user || null;
    },
    staleTime: 60 * 1000,
  });

  return {
    data,
    loading: isLoading,
    error,
    refetch,
  };
}
