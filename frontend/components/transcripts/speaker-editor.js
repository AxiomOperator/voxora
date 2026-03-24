"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useState } from "react";
import { updateSpeaker } from "@/lib/api";

export default function SpeakerEditor({
  speakers,
  transcriptId,
  onSpeakersChanged,
}) {
  if (!speakers || speakers.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No speakers detected. Assign speaker labels to segments to enable
        speaker management.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {speakers.map((speaker) => (
        <SpeakerRow
          key={speaker.id}
          speaker={speaker}
          transcriptId={transcriptId}
          onSaved={onSpeakersChanged}
        />
      ))}
    </Stack>
  );
}

function SpeakerRow({ speaker, transcriptId, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(speaker.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSpeaker(transcriptId, speaker.id, name);
      setEditing(false);
      if (onSaved) onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card withBorder radius="sm" p="sm">
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <Badge size="sm" variant="outline">
            {speaker.label}
          </Badge>
          {!editing && (
            <Text size="sm">
              {speaker.name ?? (
                <Text component="span" c="dimmed" size="sm">
                  Unnamed
                </Text>
              )}
            </Text>
          )}
        </Group>
        {!editing && (
          <Tooltip label="Rename speaker">
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
      {editing && (
        <Stack gap="xs" mt="xs">
          <TextInput
            size="xs"
            placeholder="Display name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
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
              onClick={() => {
                setEditing(false);
                setName(speaker.name ?? "");
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </Group>
        </Stack>
      )}
    </Card>
  );
}
