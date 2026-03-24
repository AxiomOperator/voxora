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

        {job.status === "failed" && (
          <RetryJobButton jobId={job.id} onRetried={onRefresh} />
        )}
      </Stack>
    </Paper>
  );
}
