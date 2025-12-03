import * as React from "react";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export default function useSupabaseImageUpload() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const uploadImage = React.useCallback(async (file) => {
    setError(null);
    if (!file) {
      setError("No file provided");
      return { error: "No file provided" };
    }
    const contentType = file.type || "application/octet-stream";
    if (!ALLOWED.has(contentType)) {
      const err = "Unsupported file type";
      setError(err);
      return { error: err };
    }
    if (file.size > MAX_BYTES) {
      const err = "File too large";
      setError(err);
      return { error: err };
    }

    setLoading(true);
    try {
      // 1) get signed upload url
      const signRes = await fetch("/api/blunari/storage/sign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType,
          size: file.size,
        }),
      });
      if (!signRes.ok) {
        const msg = `Could not create signed upload (${signRes.status})`;
        setError(msg);
        return { error: msg };
      }
      const signData = await signRes.json();
      const { signedUrl, path } = signData;
      if (!signedUrl || !path) {
        const msg = "Invalid signed upload response";
        setError(msg);
        return { error: msg };
      }

      // 2) upload directly to storage
      const putRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!putRes.ok) {
        const msg = `Upload failed (${putRes.status})`;
        setError(msg);
        return { error: msg };
      }

      // 3) get a signed read URL
      const readRes = await fetch("/api/blunari/storage/sign-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!readRes.ok) {
        const msg = `Could not sign read URL (${readRes.status})`;
        setError(msg);
        return { error: msg };
      }
      const readData = await readRes.json();
      return { path, url: readData.signedUrl, mimeType: contentType };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      return { error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return [uploadImage, { loading, error }];
}
