"use client";

import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import { useRef, useState } from "react";
import { createBatchJobs, createJob, uploadMedia } from "@/lib/api";

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
  const [diarizationEnabled, setDiarizationEnabled] = useState(false);
  const [batchJobResults, setBatchJobResults] = useState(null);
  const [batchJobError, setBatchJobError] = useState(null);
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
      await createJob({
        media_file_id: entry.result.id,
        diarization_enabled: diarizationEnabled,
      });
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

  async function handleTranscribeAll() {
    const uploadedFiles = files.filter(
      (f) => f.status === "done" && f.result?.id,
    );
    if (uploadedFiles.length === 0) return;

    setBatchJobResults(null);
    setBatchJobError(null);

    try {
      const mediaFileIds = uploadedFiles.map((f) => f.result.id);
      const results = await createBatchJobs({
        media_file_ids: mediaFileIds,
        diarization_enabled: diarizationEnabled,
      });
      setBatchJobResults(results);
      setFiles((prev) =>
        prev.map((e) =>
          e.status === "done" ? { ...e, status: "transcribing" } : e,
        ),
      );
      notifications.show({
        color: "green",
        title: "Batch jobs created",
        message: `Started transcription for ${uploadedFiles.length} file(s)`,
      });
    } catch (err) {
      setBatchJobError(err.message);
      notifications.show({
        color: "red",
        title: "Batch job error",
        message: err.message,
      });
    }
  }

  const uploadedCount = files.filter(
    (f) => f.status === "done" || f.status === "transcribing",
  ).length;

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

      <Checkbox
        label="Enable speaker diarization"
        checked={diarizationEnabled}
        onChange={(e) => setDiarizationEnabled(e.currentTarget.checked)}
      />

      {files.length > 0 && (
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {uploadedCount}/{files.length} uploaded
              {files.filter((f) => f.status === "error").length > 0 &&
                ` · ${files.filter((f) => f.status === "error").length} failed`}
            </Text>
            <Group gap="xs">
              {files.some((f) => f.status === "done") && (
                <Button
                  size="xs"
                  variant="filled"
                  onClick={handleTranscribeAll}
                >
                  Start Transcription for All
                </Button>
              )}
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                onClick={() => {
                  setFiles([]);
                  setBatchJobResults(null);
                  setBatchJobError(null);
                }}
              >
                Clear list
              </Button>
            </Group>
          </Group>

          {batchJobError && (
            <Alert color="red" title="Batch job creation failed">
              {batchJobError}
            </Alert>
          )}

          {batchJobResults && (
            <Alert color="green" title="Batch jobs created">
              {Array.isArray(batchJobResults)
                ? `${batchJobResults.length} job(s) created successfully.`
                : "Jobs created successfully."}
            </Alert>
          )}

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
