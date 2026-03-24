"use client";

import { Anchor, Badge, Skeleton, Stack, Table, Text } from "@mantine/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getTranscripts } from "@/lib/api";

export default function TranscriptList() {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTranscripts()
      .then(setTranscripts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
        Failed to load transcripts: {error}
      </Text>
    );
  }

  if (transcripts.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No transcripts yet. Upload a file and start a transcription job.
      </Text>
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
