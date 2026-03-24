"use client";

import {
  Alert,
  Button,
  Group,
  NumberInput,
  Stack,
  TextInput,
} from "@mantine/core";
import { useState } from "react";
import { createChapter, updateChapter } from "@/lib/api";

export default function ChapterEditor({
  transcriptId,
  chapter,
  onSaved,
  onCancel,
}) {
  const [title, setTitle] = useState(chapter?.title ?? "");
  const [start, setStart] = useState(chapter?.start_seconds ?? 0);
  const [end, setEnd] = useState(chapter?.end_seconds ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (Number(start) < 0) {
      setError("Start must be >= 0");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = {
        title: title.trim(),
        start_seconds: Number(start),
        end_seconds: Number(end),
      };
      const result = chapter
        ? await updateChapter(transcriptId, chapter.id, data)
        : await createChapter(transcriptId, data);
      onSaved(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap="sm">
      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}
      <TextInput
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <NumberInput
        label="Start (seconds)"
        value={start}
        onChange={setStart}
        min={0}
      />
      <NumberInput
        label="End (seconds)"
        value={end}
        onChange={setEnd}
        min={0}
      />
      <Group gap="sm">
        <Button loading={loading} onClick={handleSave}>
          Save
        </Button>
        <Button variant="subtle" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </Group>
    </Stack>
  );
}
