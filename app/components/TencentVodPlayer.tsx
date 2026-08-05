"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

type TencentPlayer = {
  dispose?: () => void;
  on?: (event: string, handler: (detail?: unknown) => void) => void;
};

declare global {
  interface Window {
    TCPlayer?: (elementId: string, options: Record<string, unknown>) => TencentPlayer;
  }
}

type SignatureResponse = {
  appId: string;
  fileId: string;
  psign: string;
  playbackMode: string;
};

const PLAYBACK_MODES = ["adaptive", "transcode", "original"] as const;

const PLAYER_SCRIPT_ID = "tencent-vod-player-sdk";
const PLAYER_STYLE_ID = "tencent-vod-player-style";
const PLAYER_SCRIPT_URL = "https://tcsdk.com/player/tcplayer/release/v5.3.4/tcplayer.v5.3.4.min.js";
const PLAYER_STYLE_URL = "https://tcsdk.com/player/tcplayer/release/v5.3.4/tcplayer.min.css";

let playerSdkPromise: Promise<void> | null = null;

function loadPlayerSdk() {
  if (typeof window === "undefined") return Promise.reject(new Error("The video player is unavailable."));
  if (window.TCPlayer) return Promise.resolve();
  if (playerSdkPromise) return playerSdkPromise;

  playerSdkPromise = new Promise<void>((resolve, reject) => {
    if (!document.getElementById(PLAYER_STYLE_ID)) {
      const stylesheet = document.createElement("link");
      stylesheet.id = PLAYER_STYLE_ID;
      stylesheet.rel = "stylesheet";
      stylesheet.href = PLAYER_STYLE_URL;
      document.head.appendChild(stylesheet);
    }

    let script = document.getElementById(PLAYER_SCRIPT_ID) as HTMLScriptElement | null;
    const handleLoad = () => {
      if (window.TCPlayer) resolve();
      else reject(new Error("The Tencent VOD player did not initialize."));
    };
    const handleError = () => reject(new Error("The Tencent VOD player script could not load."));

    if (!script) {
      script = document.createElement("script");
      script.id = PLAYER_SCRIPT_ID;
      script.src = PLAYER_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (window.TCPlayer) handleLoad();
  }).catch((reason) => {
    playerSdkPromise = null;
    throw reason;
  });

  return playerSdkPromise;
}

function describePlayerError(detail: unknown) {
  if (typeof detail === "string") return detail;
  if (!detail || typeof detail !== "object") return "Unknown Tencent VOD error";

  const event = detail as Record<string, unknown>;
  const data = event.data && typeof event.data === "object" ? event.data as Record<string, unknown> : {};
  const code = event.code ?? event.errorCode ?? data.code ?? data.errorCode;
  const message = event.message ?? event.errorMessage ?? data.message ?? data.errorMessage;
  const parts = [code !== undefined ? `code ${String(code)}` : "", message ? String(message) : ""].filter(Boolean);
  return parts.join(": ") || "Unknown Tencent VOD error";
}

export default function TencentVodPlayer({
  resourceId,
  title
}: {
  resourceId: string;
  title: string;
}) {
  const reactId = useId();
  const playerId = `vod-player-${reactId.replace(/:/g, "")}`;
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<TencentPlayer | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const attemptTokenRef = useRef(0);
  const startPlaybackRef = useRef<(modeIndex?: number) => Promise<void>>(async () => undefined);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");

  const clearPlayerTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startPlayback = useCallback(async (modeIndex = 0) => {
    const playbackMode = PLAYBACK_MODES[modeIndex] || PLAYBACK_MODES[0];
    const attemptToken = ++attemptTokenRef.current;
    setError("");
    setStatus("loading");
    clearPlayerTimeout();

    try {
      const [response] = await Promise.all([
        fetch(`/api/vod/signature?resourceId=${encodeURIComponent(resourceId)}&playback=${playbackMode}`, {
          cache: "no-store"
        }),
        loadPlayerSdk()
      ]);

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Unable to authorize this video.");
      }

      const signature = (await response.json()) as SignatureResponse;
      if (!hostRef.current || !window.TCPlayer) {
        throw new Error("The Tencent VOD player could not start.");
      }

      playerRef.current?.dispose?.();
      hostRef.current.replaceChildren();

      const video = document.createElement("video");
      video.id = playerId;
      video.className = "h-full w-full";
      video.preload = "metadata";
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("aria-label", title);
      hostRef.current.appendChild(video);

      const player = window.TCPlayer(playerId, {
        appID: signature.appId,
        fileID: signature.fileId,
        psign: signature.psign,
        autoplay: false,
        language: "en",
        controls: true
      });
      playerRef.current = player;

      let attemptFinished = false;
      const failOrTryNext = (reason: string) => {
        if (attemptFinished || attemptToken !== attemptTokenRef.current) return;
        attemptFinished = true;
        clearPlayerTimeout();

        if (modeIndex < PLAYBACK_MODES.length - 1) {
          setStatus("loading");
          window.setTimeout(() => {
            if (mountedRef.current) void startPlaybackRef.current(modeIndex + 1);
          }, 300);
          return;
        }

        setError(`Tencent VOD could not play this source (${reason}). Check the playback key and transcode result.`);
        setStatus("error");
      };

      const markReady = () => {
        if (attemptToken !== attemptTokenRef.current) return;
        clearPlayerTimeout();
        if (mountedRef.current) setStatus("ready");
      };
      player.on?.("loadedmetadata", markReady);
      player.on?.("playing", markReady);
      player.on?.("error", (detail) => {
        if (!mountedRef.current) return;
        failOrTryNext(describePlayerError(detail));
      });

      timeoutRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        failOrTryNext(`${playbackMode} timed out`);
      }, 20000);
    } catch (reason) {
      clearPlayerTimeout();
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : "Unable to start this video.");
      setStatus("error");
    }
  }, [clearPlayerTimeout, playerId, resourceId, title]);

  startPlaybackRef.current = startPlayback;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearPlayerTimeout();
      playerRef.current?.dispose?.();
      playerRef.current = null;
    };
  }, [clearPlayerTimeout]);

  return (
    <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl bg-ink">
      <div ref={hostRef} className="absolute inset-0" />

      {status === "idle" ? (
        <button
          type="button"
          onClick={() => void startPlayback(0)}
          className="absolute inset-0 z-10 flex w-full items-center justify-center bg-ink px-5 text-white"
          aria-label={`Play ${title}`}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full bg-blue text-2xl shadow-soft"
            aria-hidden="true"
          >
            ▶
          </span>
        </button>
      ) : null}

      {status === "loading" ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-ink px-5 text-center text-sm text-white/80">
          Loading secure video...
        </div>
      ) : null}

      {status === "error" ? (
        <div className="absolute inset-0 z-20 flex flex-col items-start justify-center bg-ink p-5 text-sm leading-6 text-white">
          <p>{error}</p>
          <button type="button" onClick={() => void startPlayback(0)} className="mt-4 rounded-full bg-blue px-4 py-2 font-bold">
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}
