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
import { useEffect, useState } from "react";
import { getJobs } from "@/lib/api";

export default function QueuePanel() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJobs()
      .then((all) =>
        setJobs(
          all.filter(
            (j) => j.status === "pending" || j.status === "processing",
          ),
        ),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          ? <Stack gap="xs">
              <Text size="sm" c="dimmed">
                No jobs in queue.
              </Text>
              <Badge color="gray" variant="light">
                0 active
              </Badge>
            </Stack>
          : <Stack gap="xs">
              {jobs.slice(0, 5).map((job) => (
                <Group key={job.id} justify="space-between">
                  <Anchor
                    component={Link}
                    href={`/media/${job.media_file_id}`}
                    size="sm"
                  >
                    Media #{job.media_file_id}
                  </Anchor>
                  <Badge size="xs" color="yellow">
                    {job.status}
                  </Badge>
                </Group>
              ))}
              <Badge color="yellow" variant="light">
                {jobs.length} active
              </Badge>
            </Stack>}
    </Card>
  );
}
