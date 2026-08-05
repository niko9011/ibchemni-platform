"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useState } from "react";

declare global {
  interface Window {
    TCPlayer?: (elementId: string, options: Record<string, unknown>) => {
      dispose?: () => void;
      on?: (event: string, handler: (detail?: unknown) => void) => void;
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
  const [activated, setActivated] = useState(false);
  const [signature, setSignature] = useState<SignatureResponse | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
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
    if (!activated) return;
    loadSignature().catch((reason) => {
      setError(reason instanceof Error ? reason.message : "Unable to authorize this video.");
    });
  }, [activated, loadSignature]);

  useEffect(() => {
    if (!scriptReady || !signature || !window.TCPlayer) return;

    let player: ReturnType<NonNullable<typeof window.TCPlayer>> | undefined;
    const timeout = window.setTimeout(() => {
      setError(
        "Tencent VOD did not return a playable stream. Confirm that template 100040 finished successfully, then redeploy Vercel."
      );
    }, 15000);

    try {
      player = window.TCPlayer(playerId, {
        appID: signature.appId,
        fileID: signature.fileId,
        psign: signature.psign,
        autoplay: false,
        language: "en",
        controls: true
      });
      player.on?.("loadedmetadata", () => {
        window.clearTimeout(timeout);
        setPlayerReady(true);
      });
      player.on?.("playing", () => {
        window.clearTimeout(timeout);
        setPlayerReady(true);
      });
      player.on?.("error", () => {
        window.clearTimeout(timeout);
        setError(
          "Tencent VOD could not play this source. Transcode the MOV file to adaptive HLS or MP4 (H.264/AAC), then try again."
        );
      });
    } catch {
      window.clearTimeout(timeout);
      setError("The Tencent VOD player could not start. Please refresh after deployment.");
    }

    return () => {
      window.clearTimeout(timeout);
      player?.dispose?.();
    };
  }, [playerId, scriptReady, signature]);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl bg-ink">
      <link
        rel="stylesheet"
        href="https://tcsdk.com/player/tcplayer/release/v5.3.4/tcplayer.min.css"
      />
      <Script
        src="https://tcsdk.com/player/tcplayer/release/v5.3.4/tcplayer.v5.3.4.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
        onError={() => setError("The Tencent VOD player script could not load. Please refresh and try again.")}
      />
      {!activated ? (
        <button
          type="button"
          onClick={() => setActivated(true)}
          className="flex aspect-video w-full items-center justify-center bg-ink px-5 text-white"
          aria-label={`Play ${title}`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue text-2xl shadow-soft" aria-hidden="true">▶</span>
        </button>
      ) : error ? (
        <div className="aspect-video p-5 text-sm leading-6 text-white">
          <p>{error}</p>
          <button type="button" onClick={() => { setPlayerReady(false); loadSignature().catch(() => undefined); }} className="mt-4 rounded-full bg-blue px-4 py-2 font-bold">
            Try again
          </button>
        </div>
      ) : (
        <div className="relative aspect-video">
          <video
            id={playerId}
            className="h-full w-full"
            aria-label={title}
            preload="metadata"
            playsInline
          />
          {!playerReady ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-5 text-center text-sm text-white/80">
              Loading secure video...
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
