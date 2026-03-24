"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  deleteChapter,
  deleteHighlight,
  getChapters,
  getHighlights,
  getSpeakers,
  getTranscript,
  getTranscriptSegments,
} from "@/lib/api";
import ChapterEditor from "./chapter-editor";
import ChapterList from "./chapter-list";
import ExportActions from "./export-actions";
import HighlightEditor from "./highlight-editor";
import HighlightList from "./highlight-list";
import PlaybackSyncPanel from "./playback-sync-panel";
import SpeakerEditor from "./speaker-editor";
import TimelinePanel from "./timeline-panel";
import TranscriptSegmentEditor from "./transcript-segment-editor";

function highlightText(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{ backgroundColor: "var(--mantine-color-yellow-3)", padding: 0 }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function TranscriptDetail({ transcriptId }) {
  const [transcript, setTranscript] = useState(null);
  const [segments, setSegments] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [segmentSearch, setSegmentSearch] = useState("");
  const [playbackTime, setPlaybackTime] = useState(0);
  const [editingChapter, setEditingChapter] = useState(null);
  const [chapterModalOpened, chapterModal] = useDisclosure(false);
  const [highlightModalOpened, highlightModal] = useDisclosure(false);

  useEffect(() => {
    Promise.all([
      getTranscript(transcriptId),
      getTranscriptSegments(transcriptId),
      getSpeakers(transcriptId),
      getChapters(transcriptId),
      getHighlights(transcriptId),
    ])
      .then(([t, segs, spks, chaps, highs]) => {
        setTranscript(t);
        setSegments(segs);
        setSpeakers(spks);
        setChapters(chaps);
        setHighlights(highs);
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

  function reloadChapters() {
    getChapters(transcriptId)
      .then(setChapters)
      .catch(() => {
        /* silently fail */
      });
  }

  function reloadHighlights() {
    getHighlights(transcriptId)
      .then(setHighlights)
      .catch(() => {
        /* silently fail */
      });
  }

  async function handleDeleteChapter(id) {
    try {
      await deleteChapter(transcriptId, id);
      reloadChapters();
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message,
      });
    }
  }

  async function handleDeleteHighlight(id) {
    try {
      await deleteHighlight(transcriptId, id);
      reloadHighlights();
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message,
      });
    }
  }

  function handleEditChapter(ch) {
    setEditingChapter(ch);
    chapterModal.open();
  }

  function handleAddChapter() {
    setEditingChapter(null);
    chapterModal.open();
  }

  function handleChapterSaved() {
    chapterModal.close();
    reloadChapters();
  }

  function handleHighlightSaved() {
    highlightModal.close();
    reloadHighlights();
  }

  function handleSeek(seconds) {
    setPlaybackTime(seconds);
  }

  const filteredSegments = segmentSearch
    ? segments.filter((s) =>
        s.text?.toLowerCase().includes(segmentSearch.toLowerCase()),
      )
    : segments;

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
          <Button
            component={Link}
            href={`/media/${transcript.media_file_id}`}
            variant="subtle"
            size="xs"
            px={0}
          >
            View source media →
          </Button>
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

      <Tabs defaultValue="workspace">
        <Tabs.List>
          <Tabs.Tab value="workspace">Workspace</Tabs.Tab>
          <Tabs.Tab value="segments">Segments ({segments.length})</Tabs.Tab>
          <Tabs.Tab value="speakers">Speakers ({speakers.length})</Tabs.Tab>
          <Tabs.Tab value="export">Export</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="workspace" pt="md">
          <Stack gap="lg">
            <PlaybackSyncPanel
              mediaId={transcript.media_file_id}
              segments={segments}
            />
            <TimelinePanel
              duration={transcript.duration}
              segments={segments}
              chapters={chapters}
              currentTime={playbackTime}
              onSeek={handleSeek}
            />

            <div>
              <Group justify="space-between" mb="sm">
                <Text fw={500}>Chapters ({chapters.length})</Text>
                <Button size="xs" variant="light" onClick={handleAddChapter}>
                  + Add Chapter
                </Button>
              </Group>
              <ChapterList
                chapters={chapters}
                onEdit={handleEditChapter}
                onDelete={handleDeleteChapter}
              />
            </div>

            <div>
              <Group justify="space-between" mb="sm">
                <Text fw={500}>Highlights ({highlights.length})</Text>
                <Button size="xs" variant="light" onClick={highlightModal.open}>
                  + Add Highlight
                </Button>
              </Group>
              <HighlightList
                highlights={highlights}
                onDelete={handleDeleteHighlight}
              />
            </div>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="segments" pt="md">
          <Stack gap="sm">
            <TextInput
              placeholder="Search segments..."
              value={segmentSearch}
              onChange={(e) => setSegmentSearch(e.target.value)}
            />
            {filteredSegments.length === 0
              ? <Text size="sm" c="dimmed">
                  No matching segments.
                </Text>
              : <Stack gap="xs">
                  {filteredSegments.map((seg) => (
                    <div key={seg.id}>
                      {segmentSearch && (
                        <Text size="xs" c="dimmed" px="xs" mb={2}>
                          {highlightText(seg.text, segmentSearch)}
                        </Text>
                      )}
                      <TranscriptSegmentEditor
                        segment={seg}
                        speakers={speakers}
                        transcriptId={transcriptId}
                        onSaved={handleSegmentSaved}
                      />
                    </div>
                  ))}
                </Stack>}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="speakers" pt="md">
          <SpeakerEditor
            speakers={speakers}
            transcriptId={transcriptId}
            onSpeakersChanged={handleSpeakerSaved}
          />
        </Tabs.Panel>

        <Tabs.Panel value="export" pt="md">
          <Stack gap="md">
            <ExportActions transcriptId={transcriptId} />
            <Card withBorder radius="md" p="md">
              <Text
                size="sm"
                style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}
              >
                {transcript.full_text || "No text available."}
              </Text>
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Text size="xs" c="dimmed">
        Created {new Date(transcript.created_at).toLocaleString()} · Updated{" "}
        {new Date(transcript.updated_at).toLocaleString()}
      </Text>

      <Modal
        opened={chapterModalOpened}
        onClose={chapterModal.close}
        title={editingChapter ? "Edit Chapter" : "Add Chapter"}
      >
        <ChapterEditor
          transcriptId={transcriptId}
          chapter={editingChapter}
          onSaved={handleChapterSaved}
          onCancel={chapterModal.close}
        />
      </Modal>

      <Modal
        opened={highlightModalOpened}
        onClose={highlightModal.close}
        title="Add Highlight"
      >
        <HighlightEditor
          transcriptId={transcriptId}
          onSaved={handleHighlightSaved}
          onCancel={highlightModal.close}
        />
      </Modal>
    </Stack>
  );
}
