"use client";

import { Anchor, Badge, Skeleton, Stack, Table, Text } from "@mantine/core";
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
      <Text size="sm" c="red">
        Failed to load jobs: {error}
      </Text>
    );
  }

  if (jobs.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No transcription jobs yet.
      </Text>
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
            </Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed">
                {new Date(job.created_at).toLocaleDateString()}
              </Text>
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
