"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useState } from "react";

declare global {
  interface Window {
    TCPlayer?: (elementId: string, options: Record<string, unknown>) => {
      dispose?: () => void;
    };
  }
}

type SignatureResponse = {
  appId: string;
  fileId: string;
  psign: string;
};

export default function TencentVodPlayer({
  resourceId,
  title
}: {
  resourceId: string;
  title: string;
}) {
  const reactId = useId();
  const playerId = `vod-player-${reactId.replace(/:/g, "")}`;
  const [signature, setSignature] = useState<SignatureResponse | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState("");

  const loadSignature = useCallback(async () => {
    setError("");
    const response = await fetch(`/api/vod/signature?resourceId=${encodeURIComponent(resourceId)}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Unable to authorize this video.");
    }

    setSignature(await response.json());
  }, [resourceId]);

  useEffect(() => {
    loadSignature().catch((reason) => {
      setError(reason instanceof Error ? reason.message : "Unable to authorize this video.");
    });
  }, [loadSignature]);

  useEffect(() => {
    if (!scriptReady || !signature || !window.TCPlayer) return;

    const player = window.TCPlayer(playerId, {
      appID: signature.appId,
      fileID: signature.fileId,
      psign: signature.psign,
      autoplay: false,
      language: "en",
      controls: true
    });

    return () => player.dispose?.();
  }, [playerId, scriptReady, signature]);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl bg-ink">
      <link
        rel="stylesheet"
        href="https://tcplayer.vcube.tencent.com/v5.3.4/tcplayer.min.css"
      />
      <Script
        src="https://tcplayer.vcube.tencent.com/v5.3.4/tcplayer.v5.3.4.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
      />
      {error ? (
        <div className="aspect-video p-5 text-sm leading-6 text-white">
          <p>{error}</p>
          <button type="button" onClick={() => loadSignature().catch(() => undefined)} className="mt-4 rounded-full bg-blue px-4 py-2 font-bold">
            Try again
          </button>
        </div>
      ) : (
        <video
          id={playerId}
          className="aspect-video w-full"
          aria-label={title}
          preload="metadata"
          playsInline
        />
      )}
    </div>
  );
}
