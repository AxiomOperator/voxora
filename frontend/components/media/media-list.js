"use client";

import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Skeleton,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteMedia, getMedia } from "@/lib/api";

export default function MediaList({ refreshTrigger, query }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshTrigger is an external reload signal
  useEffect(() => {
    setLoading(true);
    getMedia()
      .then(setFiles)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  async function handleDelete(id) {
    try {
      await deleteMedia(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

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
      <Alert color="red" title="Failed to load media">
        {error}
      </Alert>
    );
  }

  const displayed = query
    ? files.filter((f) =>
        f.original_name.toLowerCase().includes(query.toLowerCase()),
      )
    : files;

  if (displayed.length === 0) {
    return (
      <Stack align="center" py="xl" gap="xs">
        <Text size="lg">🎵</Text>
        <Text fw={500}>
          {query ? "No media files match your search." : "No media files yet."}
        </Text>
        {!query && (
          <Text size="sm" c="dimmed">
            Upload an audio or video file above to get started.
          </Text>
        )}
      </Stack>
    );
  }

  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Size</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Uploaded</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {displayed.map((file) => (
          <Table.Tr key={file.id}>
            <Table.Td>
              <Anchor component={Link} href={`/media/${file.id}`} size="sm">
                {file.original_name}
              </Anchor>
            </Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed">
                {file.mime_type}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{formatBytes(file.size_bytes)}</Text>
            </Table.Td>
            <Table.Td>
              <Badge color={statusColor(file.status)} variant="light" size="sm">
                {file.status}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed">
                {new Date(file.created_at).toLocaleDateString()}
              </Text>
            </Table.Td>
            <Table.Td>
              <Tooltip label="Delete">
                <ActionIcon
                  color="red"
                  variant="subtle"
                  size="sm"
                  onClick={() => handleDelete(file.id)}
                  aria-label="Delete media file"
                >
                  ✕
                </ActionIcon>
              </Tooltip>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
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

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
