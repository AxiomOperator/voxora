"use client";

import { Badge, Card, Group, SimpleGrid, Skeleton, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { getJobs, getMedia, getRuntimeInfo, getTranscripts } from "@/lib/api";

export default function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [runtime, setRuntime] = useState(null);

  useEffect(() => {
    Promise.all([getMedia(), getJobs(), getTranscripts()])
      .then(([media, jobs, transcripts]) => {
        setStats({
          totalMedia: media.length,
          totalJobs: jobs.length,
          completedJobs: jobs.filter((j) => j.status === "completed").length,
          failedJobs: jobs.filter((j) => j.status === "failed").length,
          totalTranscripts: transcripts.length,
        });
      })
      .catch(() => {
        /* silently fail */
      });
    getRuntimeInfo()
      .then(setRuntime)
      .catch(() => {
        /* silently fail */
      });
  }, []);

  const items = [
    { label: "Total Media", value: stats?.totalMedia ?? "—", color: "blue" },
    { label: "Total Jobs", value: stats?.totalJobs ?? "—", color: "gray" },
    {
      label: "Completed Jobs",
      value: stats?.completedJobs ?? "—",
      color: "green",
    },
    { label: "Failed Jobs", value: stats?.failedJobs ?? "—", color: "red" },
    {
      label: "Total Transcripts",
      value: stats?.totalTranscripts ?? "—",
      color: "violet",
    },
  ];

  return (
    <SimpleGrid cols={{ base: 2, sm: 5 }}>
      {items.map((item) => (
        <Card key={item.label} withBorder radius="md" p="md">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">
            {item.label}
          </Text>
          {stats === null
            ? <Skeleton height={28} width={40} />
            : <Text fw={700} size="xl">
                {item.value}
              </Text>}
        </Card>
      ))}
      {runtime && (
        <Card withBorder radius="md" p="md">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">
            Engine
          </Text>
          <Group gap="xs">
            <Badge
              color={runtime.device === "cuda" ? "green" : "gray"}
              variant="light"
              size="sm"
            >
              {runtime.device ?? "—"}
            </Badge>
            {runtime.model_size && (
              <Badge variant="outline" size="sm">
                {runtime.model_size}
              </Badge>
            )}
          </Group>
        </Card>
      )}
    </SimpleGrid>
  );
}
