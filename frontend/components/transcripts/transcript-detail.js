"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSpeakers, getTranscript, getTranscriptSegments } from "@/lib/api";
import ExportActions from "./export-actions";
import SpeakerEditor from "./speaker-editor";
import TranscriptSegmentEditor from "./transcript-segment-editor";

export default function TranscriptDetail({ transcriptId }) {
  const [transcript, setTranscript] = useState(null);
  const [segments, setSegments] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getTranscript(transcriptId),
      getTranscriptSegments(transcriptId),
      getSpeakers(transcriptId),
    ])
      .then(([t, segs, spks]) => {
        setTranscript(t);
        setSegments(segs);
        setSpeakers(spks);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [transcriptId]);

  function handleSegmentSaved(updated) {
    setSegments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  function handleSpeakerSaved(updated) {
    setSpeakers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

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
      {/* Header */}
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <div>
          <Group gap="xs" mb="xs">
            <Button
              component={Link}
              href="/transcripts"
              variant="subtle"
              size="xs"
              px={0}
            >
              ← Transcripts
            </Button>
          </Group>
          <Title order={2}>Transcript #{transcript.id}</Title>
          <Text c="dimmed" size="sm" mt="xs">
            Media #{transcript.media_file_id} · Job #{transcript.job_id}
          </Text>
        </div>
        <Group gap="sm">
          {transcript.detected_language && (
            <Badge size="lg" variant="light">
              {transcript.detected_language}
            </Badge>
          )}
          <ExportActions transcriptId={transcriptId} />
        </Group>
      </Group>

      {/* Tabs */}
      <Tabs defaultValue="segments">
        <Tabs.List>
          <Tabs.Tab value="segments">Segments ({segments.length})</Tabs.Tab>
          <Tabs.Tab value="fulltext">Full Text</Tabs.Tab>
          <Tabs.Tab value="speakers">Speakers ({speakers.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="segments" pt="md">
          {segments.length === 0
            ? <Text size="sm" c="dimmed">
                No segments available.
              </Text>
            : <Stack gap="xs">
                {segments.map((seg) => (
                  <TranscriptSegmentEditor
                    key={seg.id}
                    segment={seg}
                    speakers={speakers}
                    transcriptId={transcriptId}
                    onSaved={handleSegmentSaved}
                  />
                ))}
              </Stack>}
        </Tabs.Panel>

        <Tabs.Panel value="fulltext" pt="md">
          <Card withBorder radius="md" p="md">
            <Text size="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
              {transcript.full_text || "No text available."}
            </Text>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="speakers" pt="md">
          <SpeakerEditor
            speakers={speakers}
            transcriptId={transcriptId}
            onSpeakersChanged={handleSpeakerSaved}
          />
        </Tabs.Panel>
      </Tabs>

      <Text size="xs" c="dimmed">
        Created {new Date(transcript.created_at).toLocaleString()} · Updated{" "}
        {new Date(transcript.updated_at).toLocaleString()}
      </Text>
    </Stack>
  );
}
