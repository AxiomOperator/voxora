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
import { getTranscripts } from "@/lib/api";

export default function TranscriptList({
  items: itemsProp,
  loading: loadingProp,
  error: errorProp,
}) {
  const [internalTranscripts, setInternalTranscripts] = useState([]);
  const [internalLoading, setInternalLoading] = useState(
    itemsProp === undefined,
  );
  const [internalError, setInternalError] = useState(null);

  useEffect(() => {
    if (itemsProp !== undefined) return;
    setInternalLoading(true);
    getTranscripts()
      .then(setInternalTranscripts)
      .catch((err) => setInternalError(err.message))
      .finally(() => setInternalLoading(false));
  }, [itemsProp]);

  const transcripts = itemsProp !== undefined ? itemsProp : internalTranscripts;
  const loading = loadingProp !== undefined ? loadingProp : internalLoading;
  const error = errorProp !== undefined ? errorProp : internalError;

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
      <Alert color="red" title="Failed to load transcripts">
        {error}
      </Alert>
    );
  }

  if (transcripts.length === 0) {
    return (
      <Stack align="center" py="xl" gap="xs">
        <Text size="lg">📄</Text>
        <Text fw={500}>No transcripts yet.</Text>
        <Text size="sm" c="dimmed">
          Start a transcription job from a{" "}
          <Anchor component={Link} href="/jobs" size="sm">
            media file
          </Anchor>{" "}
          to generate transcripts.
        </Text>
      </Stack>
    );
  }

  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>ID</Table.Th>
          <Table.Th>Language</Table.Th>
          <Table.Th>Preview</Table.Th>
          <Table.Th>Created</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {transcripts.map((t) => (
          <Table.Tr key={t.id}>
            <Table.Td>
              <Anchor component={Link} href={`/transcripts/${t.id}`} size="sm">
                #{t.id}
              </Anchor>
            </Table.Td>
            <Table.Td>
              <Badge variant="light" size="sm">
                {t.detected_language ?? "—"}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Text size="sm" lineClamp={1} maw={400}>
                {t.full_text || "—"}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed">
                {new Date(t.created_at).toLocaleDateString()}
              </Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
