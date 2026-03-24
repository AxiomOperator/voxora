"use client";

import { Stack, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { getMediaStreamUrl } from "@/lib/api";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function PlaybackSyncPanel({ mediaId, segments }) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function handleTimeUpdate() {
      setCurrentTime(audio.currentTime);
    }

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  const activeSegmentId = segments.find(
    (s) => s.start_seconds <= currentTime && currentTime < s.end_seconds,
  )?.id;

  return (
    <Stack gap="sm">
      {/* biome-ignore lint/a11y/useMediaCaption: media source is user-uploaded audio */}
      <audio
        ref={audioRef}
        src={getMediaStreamUrl(mediaId)}
        controls
        style={{ width: "100%" }}
      />
      <div style={{ maxHeight: 400, overflow: "auto" }}>
        {segments.map((seg) => (
          <button
            key={seg.id}
            type="button"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = seg.start_seconds;
                audioRef.current.play();
              }
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              border: "none",
              background: "none",
              padding: "6px 8px",
              cursor: "pointer",
              borderRadius: 4,
              backgroundColor:
                seg.id === activeSegmentId
                  ? "var(--mantine-color-blue-1)"
                  : "transparent",
            }}
          >
            <Text size="xs" c="dimmed" span>
              {formatTime(seg.start_seconds)}
              {seg.speaker_label ? ` · ${seg.speaker_label}` : ""}
            </Text>{" "}
            <Text size="sm" span>
              {seg.text}
            </Text>
          </button>
        ))}
      </div>
    </Stack>
  );
}
