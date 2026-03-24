"use client";

import {
  Anchor,
  Badge,
  Card,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RetryJobButton from "@/components/jobs/retry-job-button";
import { getJobs } from "@/lib/api";

export default function QueuePanel() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    getJobs()
      .then((all) => setJobs(all.slice(0, 8)))
      .catch(() => {
        /* silently fail */
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card withBorder radius="md" p="md" style={{ minWidth: 0 }}>
      <Title order={5} mb="sm">
        Processing Queue
      </Title>
      {loading
        ? <Stack gap="xs">
            <Skeleton height={20} />
            <Skeleton height={20} />
          </Stack>
        : jobs.length === 0
          ? <Text size="sm" c="dimmed">
              No jobs yet.
            </Text>
          : <Stack gap="xs">
              {jobs.map((job) => (
                <Group key={job.id} justify="space-between" wrap="nowrap">
                  <Anchor component={Link} href={`/jobs/${job.id}`} size="sm">
                    Job #{job.id} · Media #{job.media_file_id}
                  </Anchor>
                  <Group gap="xs">
                    <Badge
                      size="xs"
                      color={statusColor(job.status)}
                      variant="light"
                    >
                      {job.status}
                    </Badge>
                    {job.status === "failed" && (
                      <RetryJobButton jobId={job.id} onRetried={load} />
                    )}
                    {job.status === "completed" && job.transcript_id && (
                      <Anchor
                        component={Link}
                        href={`/transcripts/${job.transcript_id}`}
                        size="xs"
                      >
                        Transcript
                      </Anchor>
                    )}
                  </Group>
                </Group>
              ))}
            </Stack>}
    </Card>
  );
}

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
