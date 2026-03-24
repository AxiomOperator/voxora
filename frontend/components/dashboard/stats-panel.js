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
          activeJobs: jobs.filter(
            (j) => j.status === "processing" || j.status === "pending",
          ).length,
          completedJobs: jobs.filter((j) => j.status === "completed").length,
          failedJobs: jobs.filter((j) => j.status === "failed").length,
          transcripts: transcripts.length,
        });
      })
      .catch(() => {});
  }, []);

  const items = [
    { label: "Media Files", value: stats?.totalFiles ?? "—", color: "blue" },
    { label: "Active Jobs", value: stats?.activeJobs ?? "—", color: "yellow" },
    { label: "Transcripts", value: stats?.transcripts ?? "—", color: "green" },
    { label: "Failed Jobs", value: stats?.failedJobs ?? "—", color: "red" },
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
