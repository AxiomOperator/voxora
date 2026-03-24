"use client";

import { Badge, Group, Skeleton, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { getMedia } from "@/lib/api";

export default function MediaList() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMedia()
      .then(setFiles)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Stack gap="xs">
        <Skeleton height={24} radius="sm" />
        <Skeleton height={24} radius="sm" />
        <Skeleton height={24} radius="sm" />
      </Stack>
    );
  }

  if (error) {
    return (
      <Text size="sm" c="red">
        Failed to load media: {error}
      </Text>
    );
  }

  if (files.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No media files yet.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {files.map((file) => (
        <Group key={file.id} justify="space-between" wrap="nowrap">
          <Text size="sm" truncate>
            {file.original_name}
          </Text>
          <Badge color={statusColor(file.status)} variant="light" size="sm">
            {file.status}
          </Badge>
        </Group>
      ))}
    </Stack>
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
