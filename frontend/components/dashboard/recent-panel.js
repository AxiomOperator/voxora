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
import { getMedia } from "@/lib/api";

export default function RecentPanel() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMedia()
      .then((all) => setFiles(all.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card withBorder radius="md" p="md" style={{ minWidth: 0 }}>
      <Title order={5} mb="sm">
        Recent Files
      </Title>
      {loading
        ? <Stack gap="xs">
            <Skeleton height={20} />
            <Skeleton height={20} />
            <Skeleton height={20} />
          </Stack>
        : files.length === 0
          ? <Text size="sm" c="dimmed">
              No media files yet.
            </Text>
          : <Stack gap="xs">
              {files.map((f) => (
                <Group key={f.id} justify="space-between" wrap="nowrap">
                  <Anchor
                    component={Link}
                    href={`/media/${f.id}`}
                    size="sm"
                    truncate
                  >
                    {f.original_name}
                  </Anchor>
                  <Badge
                    size="xs"
                    color={statusColor(f.status)}
                    variant="light"
                    style={{ flexShrink: 0 }}
                  >
                    {f.status}
                  </Badge>
                </Group>
              ))}
            </Stack>}
    </Card>
  );
}

function statusColor(status) {
  switch (status) {
    case "done":
      return "green";
    case "processing":
      return "yellow";
    case "error":
      return "red";
    default:
      return "gray";
  }
}
