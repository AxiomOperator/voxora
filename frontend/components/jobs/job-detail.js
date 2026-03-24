"use client";

import {
  Alert,
  Anchor,
  Badge,
  Button,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import RetryJobButton from "./retry-job-button";

function statusColor(status) {
  switch (status) {
    case "completed":
      return "green";
    case "processing":
      return "yellow";
    case "failed":
      return "red";
    default:
      return "gray";
  }
}

function fmt(val) {
  return val ? new Date(val).toLocaleString() : "—";
}

export default function JobDetail({ job, onRefresh }) {
  let runtimeMeta = null;
  try {
    if (job.runtime_metadata) {
      runtimeMeta = JSON.parse(job.runtime_metadata);
    }
  } catch {}

  return (
    <Stack gap="lg">
      <Group gap="xs">
        <Button component={Link} href="/jobs" variant="subtle" size="xs" px={0}>
          ← Jobs
        </Button>
      </Group>

      <Group justify="space-between" align="flex-start">
        <Title order={2}>Job #{job.id}</Title>
        <Badge color={statusColor(job.status)} variant="light" size="lg">
          {job.status}
        </Badge>
      </Group>

      <Stack gap="xs">
        <Group gap="xs">
          <Text size="sm" fw={500}>
            Media:
          </Text>
          <Anchor
            component={Link}
            href={`/media/${job.media_file_id}`}
            size="sm"
          >
            Media #{job.media_file_id}
          </Anchor>
        </Group>

        {job.transcript_id && (
          <Group gap="xs">
            <Text size="sm" fw={500}>
              Transcript:
            </Text>
            <Anchor
              component={Link}
              href={`/transcripts/${job.transcript_id}`}
              size="sm"
            >
              Transcript #{job.transcript_id}
            </Anchor>
          </Group>
        )}

        <Text size="sm">
          <Text span fw={500}>
            Created:
          </Text>{" "}
          {fmt(job.created_at)}
        </Text>
        <Text size="sm">
          <Text span fw={500}>
            Started:
          </Text>{" "}
          {fmt(job.started_at)}
        </Text>
        <Text size="sm">
          <Text span fw={500}>
            Completed:
          </Text>{" "}
          {fmt(job.completed_at)}
        </Text>
      </Stack>

      {job.error_message && (
        <Alert color="red" title="Error">
          {job.error_message}
        </Alert>
      )}

      {runtimeMeta?.diarization_enabled && (
        <Stack gap="xs">
          <Text fw={500} size="sm">
            Diarization
          </Text>
          <Group gap="xs">
            <Badge variant="outline" size="sm">
              Backend: {runtimeMeta.diarization_backend ?? "—"}
            </Badge>
            <Badge
              color={
                runtimeMeta.diarization_status === "done" ||
                runtimeMeta.diarization_status === "completed"
                  ? "green"
                  : runtimeMeta.diarization_status === "failed"
                    ? "red"
                    : "blue"
              }
              variant="light"
              size="sm"
            >
              {runtimeMeta.diarization_status ?? "unknown"}
            </Badge>
          </Group>
          {runtimeMeta.diarization_error && (
            <Alert color="yellow" title="Diarization issue">
              {runtimeMeta.diarization_error}
            </Alert>
          )}
        </Stack>
      )}

      {job.status === "failed" && (
        <RetryJobButton jobId={job.id} onRetried={onRefresh} />
      )}
    </Stack>
  );
}
