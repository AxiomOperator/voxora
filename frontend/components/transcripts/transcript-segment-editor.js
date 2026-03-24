"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Select,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { useState } from "react";
import { updateSegment } from "@/lib/api";

export default function TranscriptSegmentEditor({
  segment,
  speakers,
  transcriptId,
  onSaved,
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(segment.text);
  const [speakerLabel, setSpeakerLabel] = useState(segment.speaker_label ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const speakerOptions = speakers.map((s) => ({
    value: s.label,
    label: s.name ? `${s.name} (${s.label})` : s.label,
  }));

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSegment(transcriptId, segment.id, {
        text,
        speaker_label: speakerLabel || null,
      });
      setEditing(false);
      if (onSaved) onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setText(segment.text);
    setSpeakerLabel(segment.speaker_label ?? "");
    setError(null);
    setEditing(false);
  }

  return (
    <Card withBorder radius="sm" p="sm">
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Group gap="xs">
          <Badge size="xs" variant="outline" color="gray">
            #{segment.segment_index}
          </Badge>
          <Text size="xs" c="dimmed">
            {formatTime(segment.start_seconds)} →{" "}
            {formatTime(segment.end_seconds)}
          </Text>
        </Group>
        {!editing && (
          <Tooltip label="Edit segment">
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={() => setEditing(true)}
            >
              ✎
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {editing
        ? <Stack gap="xs">
            {speakerOptions.length > 0 && (
              <Select
                size="xs"
                placeholder="Speaker"
                data={speakerOptions}
                value={speakerLabel}
                onChange={(val) => setSpeakerLabel(val ?? "")}
                clearable
              />
            )}
            <Textarea
              size="sm"
              value={text}
              onChange={(e) => setText(e.currentTarget.value)}
              autosize
              minRows={2}
            />
            {error && (
              <Text size="xs" c="red">
                {error}
              </Text>
            )}
            <Group gap="xs">
              <Button size="xs" onClick={handleSave} loading={saving}>
                Save
              </Button>
              <Button
                size="xs"
                variant="subtle"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
            </Group>
          </Stack>
        : <Stack gap="xs">
            {speakerLabel && (
              <Badge size="xs" variant="light" color="blue">
                {speakers.find((s) => s.label === speakerLabel)?.name ??
                  speakerLabel}
              </Badge>
            )}
            <Text size="sm">{text}</Text>
          </Stack>}
    </Card>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
