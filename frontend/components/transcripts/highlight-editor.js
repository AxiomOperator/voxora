"use client";

import { Alert, Button, Group, Stack, Textarea } from "@mantine/core";
import { useState } from "react";
import { createHighlight } from "@/lib/api";

export default function HighlightEditor({
  transcriptId,
  segmentId,
  onSaved,
  onCancel,
}) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const result = await createHighlight(transcriptId, {
        note: note.trim() || null,
        segment_id: segmentId ?? null,
      });
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
      <Textarea
        label="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
      />
      <Group gap="sm">
        <Button loading={loading} onClick={handleSave}>
          Save highlight
        </Button>
        <Button variant="subtle" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </Group>
    </Stack>
  );
}
