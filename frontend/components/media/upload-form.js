"use client";

import { Alert, Group, Stack, Text } from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { useState } from "react";
import { uploadMedia } from "@/lib/api";

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

export default function UploadForm({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleDrop(files) {
    if (!files.length) return;
    const file = files[0];
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await uploadMedia(file);
      setSuccess(`"${result.original_name}" uploaded successfully.`);
      if (onUploaded) onUploaded(result);
    } catch (err) {
      const msg = err.message ?? "";
      if (msg.includes("400")) {
        setError(
          "Upload rejected: invalid file type or empty file. Please upload a valid audio or video file.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <Stack gap="sm">
      {error && (
        <Alert
          color="red"
          title="Upload failed"
          onClose={() => setError(null)}
          withCloseButton
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          color="green"
          title="Upload complete"
          onClose={() => setSuccess(null)}
          withCloseButton
        >
          {success}
        </Alert>
      )}
      <Dropzone
        onDrop={handleDrop}
        accept={ACCEPTED_MIME}
        maxSize={500 * 1024 * 1024}
        loading={uploading}
        disabled={uploading}
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
              Drop audio or video file here, or click to browse
            </Text>
            <Text size="xs" c="dimmed">
              MP3, WAV, MP4, OGG, FLAC — up to 500 MB
            </Text>
          </Stack>
        </Group>
      </Dropzone>
    </Stack>
  );
}
