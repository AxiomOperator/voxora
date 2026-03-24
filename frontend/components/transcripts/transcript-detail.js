"use client";

import {
  Alert,
  Badge,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { getTranscript, getTranscriptSegments } from "@/lib/api";
import TranscriptSegmentList from "./transcript-segment-list";

export default function TranscriptDetail({ transcriptId }) {
  const [transcript, setTranscript] = useState(null);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getTranscript(transcriptId),
      getTranscriptSegments(transcriptId),
    ])
      .then(([t, segs]) => {
        setTranscript(t);
        setSegments(segs);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [transcriptId]);

  if (loading) {
    return (
      <Center h="40vh">
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Error">
        {error}
      </Alert>
    );
  }

  if (!transcript) return null;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Transcript #{transcript.id}</Title>
          <Text c="dimmed" size="sm" mt="xs">
            Media #{transcript.media_file_id} · Job #{transcript.job_id}
          </Text>
        </div>
        {transcript.detected_language && (
          <Badge size="lg" variant="light">
            {transcript.detected_language}
          </Badge>
        )}
      </Group>

      <Card withBorder radius="md" p="md">
        <Title order={5} mb="sm">
          Full Text
        </Title>
        <Text size="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
          {transcript.full_text || "No text available."}
        </Text>
      </Card>

      <Divider />

      <div>
        <Title order={5} mb="sm">
          Segments ({segments.length})
        </Title>
        <TranscriptSegmentList segments={segments} />
      </div>

      <Text size="xs" c="dimmed">
        Created {new Date(transcript.created_at).toLocaleString()}
      </Text>
    </Stack>
  );
}
