"use client";

import {
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Textarea,
} from "@mantine/core";
import { useState } from "react";
import { createNote, updateNote } from "@/lib/api";

export default function NoteEditor({
  transcriptId,
  note,
  segments,
  onSaved,
  onCancel,
}) {
  const [content, setContent] = useState(note?.content ?? "");
  const [segmentId, setSegmentId] = useState(
    note?.segment_id ? String(note.segment_id) : null,
  );
  const [startSeconds, setStartSeconds] = useState(note?.start_seconds ?? "");
  const [endSeconds, setEndSeconds] = useState(note?.end_seconds ?? "");
  const [loading, setLoading] = useState(false);
  const [contentError, setContentError] = useState("");

  const segmentOptions = segments
    ? [
        { value: "", label: "No segment" },
        ...segments.map((s) => ({
          value: String(s.id),
          label: `#${s.id} – ${(s.text || "").slice(0, 40)}`,
        })),
      ]
    : [];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) {
      setContentError("Content is required");
      return;
    }
    setContentError("");
    setLoading(true);
    try {
      const data = {
        content: content.trim(),
        segment_id: segmentId ? Number(segmentId) : undefined,
        start_seconds: startSeconds !== "" ? Number(startSeconds) : undefined,
        end_seconds: endSeconds !== "" ? Number(endSeconds) : undefined,
      };
      const saved = note
        ? await updateNote(transcriptId, note.id, data)
        : await createNote(transcriptId, data);
      onSaved?.(saved);
    } catch (err) {
      setContentError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Textarea
          label="Note"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          error={contentError}
          placeholder="Enter note content..."
          rows={4}
        />
        {segmentOptions.length > 1 && (
          <Select
            label="Link to segment (optional)"
            data={segmentOptions}
            value={segmentId ?? ""}
            onChange={(v) => setSegmentId(v || null)}
            clearable
          />
        )}
        <Group grow>
          <NumberInput
            label="Start (seconds)"
            value={startSeconds}
            onChange={setStartSeconds}
            min={0}
            step={0.1}
            placeholder="Optional"
          />
          <NumberInput
            label="End (seconds)"
            value={endSeconds}
            onChange={setEndSeconds}
            min={0}
            step={0.1}
            placeholder="Optional"
          />
        </Group>
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {note ? "Save Changes" : "Add Note"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
