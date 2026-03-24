"use client";

import {
  Alert,
  Anchor,
  Badge,
  Group,
  Paper,
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

export function JobRuntimePanel({ job, onRefresh }) {
  let runtimeMeta = null;
  try {
    if (job.runtime_metadata) {
      runtimeMeta = JSON.parse(job.runtime_metadata);
    }
  } catch {}

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={4}>Job Diagnostics</Title>
          <Badge color={statusColor(job.status)} variant="light" size="lg">
            {job.status}
          </Badge>
        </Group>

        {job.error_message && (
          <Alert color="red" title="Error">
            {job.error_message}
          </Alert>
        )}

        <Stack gap="xs">
          <Group gap="xs">
            <Text size="sm" fw={500} w={90}>
              Media:
            </Text>
            <Anchor
              component={Link}
              href={`/media/${job.media_file_id}`}
              size="sm"
            >
              #{job.media_file_id}
            </Anchor>
          </Group>

          {job.transcript_id && (
            <Group gap="xs">
              <Text size="sm" fw={500} w={90}>
                Transcript:
              </Text>
              <Anchor
                component={Link}
                href={`/transcripts/${job.transcript_id}`}
                size="sm"
              >
                #{job.transcript_id}
              </Anchor>
            </Group>
          )}

          <Group gap="xs">
            <Text size="sm" fw={500} w={90}>
              Created:
            </Text>
            <Text size="sm">{fmt(job.created_at)}</Text>
          </Group>

          <Group gap="xs">
            <Text size="sm" fw={500} w={90}>
              Started:
            </Text>
            <Text size="sm">{fmt(job.started_at)}</Text>
          </Group>

          <Group gap="xs">
            <Text size="sm" fw={500} w={90}>
              Completed:
            </Text>
            <Text size="sm">{fmt(job.completed_at)}</Text>
          </Group>
        </Stack>

        {runtimeMeta && (
          <Group gap="xs" mt="xs">
            <Badge
              color={runtimeMeta.compute_device === "cuda" ? "green" : "orange"}
            >
              {runtimeMeta.compute_device === "cuda" ? "⚡ GPU" : "CPU"}
            </Badge>
            {runtimeMeta.model_name && (
              <Badge variant="outline">{runtimeMeta.model_name}</Badge>
            )}
            {runtimeMeta.processing_seconds != null && (
              <Text size="xs" c="dimmed">
                {runtimeMeta.processing_seconds}s
              </Text>
            )}
          </Group>
        )}
        {runtimeMeta?.fallback_used && (
          <Alert color="yellow" title="GPU fallback to CPU" mt="xs">
            {runtimeMeta.fallback_reason ??
              "GPU unavailable, used CPU instead."}
          </Alert>
        )}

        {runtimeMeta?.diarization_enabled && (
          <Stack gap="xs" mt="xs">
            <Text size="sm" fw={500}>
              Diarization
            </Text>
            <Group gap="xs">
              {runtimeMeta.diarization_backend && (
                <Badge variant="outline" size="sm">
                  {runtimeMeta.diarization_backend}
                </Badge>
              )}
              {runtimeMeta.diarization_status && (
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
                  {runtimeMeta.diarization_status}
                </Badge>
              )}
            </Group>
            {runtimeMeta.diarization_error && (
              <Alert color="red" title="Diarization error" mt="xs">
                {runtimeMeta.diarization_error}
              </Alert>
            )}
          </Stack>
        )}

        {job.status === "failed" && (
          <RetryJobButton jobId={job.id} onRetried={onRefresh} />
        )}
      </Stack>
    </Paper>
  );
}
