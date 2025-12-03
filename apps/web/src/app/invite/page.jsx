"use client";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import useMe from "@/utils/useMe";
import { toast } from "sonner";

export default function InvitePage() {
  const { data: me, loading: meLoading } = useMe();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["referrals-me"],
    queryFn: async () => {
      const res = await fetch("/api/referrals/me", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) return null; // not signed in
        throw new Error(
          `When fetching /api/referrals/me, got [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const handleCopy = useCallback(async () => {
    if (!data?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(data.inviteUrl);
      toast.success("Link copied");
    } catch (e) {
      console.error(e);
      toast.error("Could not copy link");
    }
  }, [data?.inviteUrl]);

  const handleShare = useCallback(async () => {
    if (!data?.inviteUrl) return;
    const text = "Join me on Blunari!";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Invite", text, url: data.inviteUrl });
      } else {
        await navigator.clipboard.writeText(data.inviteUrl);
        toast.success("Link copied");
      }
      toast.success("Thanks for sharing");
    } catch (e) {
      // user canceled is fine, otherwise show small toast
      if (e && e.name !== "AbortError") {
        console.error(e);
        toast.error("Could not share link");
      }
    }
  }, [data?.inviteUrl]);

  if (meLoading || isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-12 w-full bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-12 w-full bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Invite friends</h1>
        <p className="text-gray-600 mb-4">
          Sign in to access your personal invite link.
        </p>
        <a
          className="inline-block px-4 py-2 bg-black text-white rounded"
          href="/account/signin?callbackUrl=/invite"
        >
          Sign in
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Invite friends</h1>
        <p className="text-red-600">
          Sorry, we couldn't load your invite. Please try again.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 border rounded"
          aria-label="Retry loading invite"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Invite friends</h1>
        <p className="text-gray-600">No invite available yet.</p>
      </div>
    );
  }

  const { inviteUrl, clicks = 0, signups = 0, code } = data;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Invite friends</h1>
      <div className="bg-white border rounded p-4 mb-6">
        <label className="text-sm text-gray-600">Your invite link</label>
        <div className="flex flex-col md:flex-row gap-3 mt-2">
          <input
            readOnly
            value={inviteUrl || "Generating..."}
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-2 border rounded"
              aria-label="Copy invite link"
            >
              Copy
            </button>
            <button
              onClick={handleShare}
              className="px-3 py-2 bg-black text-white rounded"
              aria-label="Share invite link"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-500">Clicks</div>
          <div className="text-2xl font-semibold">{clicks}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-500">Signups</div>
          <div className="text-2xl font-semibold">{signups}</div>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>
          Your code: <span className="font-mono">{code}</span>
        </p>
        <p className="mt-1">
          Share your link with friends. When they sign up within 14 days, you'll
          get +20 XP.
        </p>
      </div>
    </div>
  );
}
