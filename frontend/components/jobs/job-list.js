"use client";

import {
  Alert,
  Anchor,
  Badge,
  Skeleton,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getJobs } from "@/lib/api";

export default function JobList({ status }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getJobs(status && status !== "all" ? { status } : undefined)
      .then(setJobs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status]);

  if (loading) {
    return (
      <Stack gap="xs">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={36} radius="sm" />
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Failed to load jobs">
        {error}
      </Alert>
    );
  }

  if (jobs.length === 0) {
    return (
      <Stack align="center" py="xl" gap="xs">
        <Text size="lg">📋</Text>
        <Text fw={500}>No transcription jobs yet.</Text>
        <Text size="sm" c="dimmed">
          Open a media file and click &ldquo;Start Transcription&rdquo; to
          create one.
        </Text>
      </Stack>
    );
  }

  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Job</Table.Th>
          <Table.Th>Media</Table.Th>
          <Table.Th>Language</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Duration</Table.Th>
          <Table.Th>Created</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {jobs.map((job) => (
          <Table.Tr key={job.id}>
            <Table.Td>
              <Anchor component={Link} href={`/jobs/${job.id}`} size="sm">
                #{job.id}
              </Anchor>
            </Table.Td>
            <Table.Td>
              <Anchor
                component={Link}
                href={`/media/${job.media_file_id}`}
                size="sm"
              >
                Media #{job.media_file_id}
              </Anchor>
            </Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed">
                {job.language ?? "—"}
              </Text>
            </Table.Td>
            <Table.Td>
              <Badge
                color={jobStatusColor(job.status)}
                variant="light"
                size="sm"
              >
                {job.status}
              </Badge>
              {job.status === "failed" && job.error_message && (
                <Text size="xs" c="red" mt={2} lineClamp={1}>
                  {job.error_message}
                </Text>
              )}
            </Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed">
                {job.duration_seconds != null
                  ? formatDuration(job.duration_seconds)
                  : "—"}
              </Text>
            </Table.Td>
            <Table.Td>
              <Stack gap={2}>
                <Text size="sm" c="dimmed">
                  {new Date(job.created_at).toLocaleDateString()}
                </Text>
                {job.status === "completed" && job.transcript_id && (
                  <Anchor
                    component={Link}
                    href={`/transcripts/${job.transcript_id}`}
                    size="xs"
                  >
                    View Transcript
                  </Anchor>
                )}
              </Stack>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function jobStatusColor(status) {
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

function formatDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}
