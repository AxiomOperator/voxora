"use client";

import { Badge, Button, Group, Stack, Text } from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import { useRef, useState } from "react";
import { createJob, uploadMedia } from "@/lib/api";

const ACCEPTED_MIME = [
  MIME_TYPES.mp4,
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
  "audio/m4a",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

function statusBadgeColor(status) {
  switch (status) {
    case "done":
      return "green";
    case "uploading":
      return "yellow";
    case "error":
      return "red";
    case "transcribing":
      return "blue";
    default:
      return "gray";
  }
}

export default function BatchUploadForm({ onUploaded }) {
  const [files, setFiles] = useState([]);
  const idRef = useRef(0);

  async function handleDrop(dropped) {
    const newEntries = dropped.map((f) => ({
      id: ++idRef.current,
      file: f,
      status: "pending",
      result: null,
      error: null,
    }));
    setFiles((prev) => [...prev, ...newEntries]);

    for (const entry of newEntries) {
      setFiles((prev) =>
        prev.map((e) =>
          e.id === entry.id ? { ...e, status: "uploading" } : e,
        ),
      );
      try {
        const result = await uploadMedia(entry.file);
        setFiles((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, status: "done", result } : e,
          ),
        );
        if (onUploaded) onUploaded(result);
      } catch (err) {
        setFiles((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? { ...e, status: "error", error: err.message }
              : e,
          ),
        );
      }
    }
  }

  async function handleTranscribe(entry) {
    setFiles((prev) =>
      prev.map((e) =>
        e.id === entry.id ? { ...e, status: "transcribing" } : e,
      ),
    );
    try {
      await createJob(entry.result.id);
      notifications.show({
        color: "green",
        title: "Job created",
        message: `Transcription started for ${entry.file.name}`,
      });
    } catch (err) {
      setFiles((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, status: "done" } : e)),
      );
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message,
      });
    }
  }

  return (
    <Stack gap="sm">
      <Dropzone
        onDrop={handleDrop}
        accept={ACCEPTED_MIME}
        maxSize={500 * 1024 * 1024}
        multiple
      >
        <Group
          justify="center"
          gap="xl"
          mih={100}
          style={{ pointerEvents: "none" }}
        >
          <Stack align="center" gap="xs">
            <Text size="xl">🎵</Text>
            <Text size="sm" fw={500}>
              Drop audio or video files here, or click to browse
            </Text>
            <Text size="xs" c="dimmed">
              MP3, WAV, MP4, OGG, FLAC — up to 500 MB each · multiple files
              supported
            </Text>
          </Stack>
        </Group>
      </Dropzone>

      {files.length > 0 && (
        <Stack gap="xs">
          {files.map((entry) => (
            <Group key={entry.id} justify="space-between" wrap="nowrap">
              <Text size="sm" truncate style={{ flex: 1 }}>
                {entry.file.name}
              </Text>
              <Group gap="xs" style={{ flexShrink: 0 }}>
                <Badge
                  color={statusBadgeColor(entry.status)}
                  variant="light"
                  size="sm"
                >
                  {entry.status}
                </Badge>
                {entry.status === "done" && (
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => handleTranscribe(entry)}
                  >
                    Start Transcription
                  </Button>
                )}
                {entry.status === "error" && entry.error && (
                  <Text size="xs" c="red">
                    {entry.error}
                  </Text>
                )}
              </Group>
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
