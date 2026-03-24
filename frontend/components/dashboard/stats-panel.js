"use client";

import { Card, SimpleGrid, Skeleton, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { getJobs, getMedia, getTranscripts } from "@/lib/api";

export default function StatsPanel() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([getMedia(), getJobs(), getTranscripts()])
      .then(([media, jobs, transcripts]) => {
        setStats({
          totalFiles: media.length,
          processing: jobs.filter(
            (j) => j.status === "processing" || j.status === "pending",
          ).length,
          completed: transcripts.length,
          errors: jobs.filter((j) => j.status === "error").length,
        });
      })
      .catch(() => {});
  }, []);

  const items = [
    { label: "Total Files", value: stats?.totalFiles ?? "—", color: "blue" },
    { label: "Processing", value: stats?.processing ?? "—", color: "yellow" },
    { label: "Transcripts", value: stats?.completed ?? "—", color: "green" },
    { label: "Errors", value: stats?.errors ?? "—", color: "red" },
  ];

  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }}>
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
    </SimpleGrid>
  );
}
