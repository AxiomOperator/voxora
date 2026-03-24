"use client";

import { ActionIcon, Group, Stack, Text } from "@mantine/core";

export default function NoteList({ notes, onEdit, onDelete }) {
  if (!notes || notes.length === 0) {
    return (
      <Text size="sm" c="dimmed" py="sm">
        No notes yet.
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {notes.map((note) => (
        <Stack
          key={note.id}
          gap={4}
          p="xs"
          style={{
            borderLeft: "3px solid var(--mantine-color-blue-4)",
            paddingLeft: 12,
          }}
        >
          <Text size="sm">{note.content}</Text>
          {note.segment_id && (
            <Text size="xs" c="dimmed">
              Linked to segment #{note.segment_id}
            </Text>
          )}
          {note.start_seconds != null && (
            <Text size="xs" c="dimmed">
              {note.start_seconds}s
              {note.end_seconds != null ? ` – ${note.end_seconds}s` : ""}
            </Text>
          )}
          <Group gap="xs" justify="space-between">
            <Text size="xs" c="dimmed">
              {new Date(note.created_at).toLocaleString()}
            </Text>
            <Group gap={4}>
              <ActionIcon
                variant="subtle"
                size="xs"
                onClick={() => onEdit?.(note)}
                aria-label="Edit note"
              >
                ✏️
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="red"
                size="xs"
                onClick={() => onDelete?.(note.id)}
                aria-label="Delete note"
              >
                🗑️
              </ActionIcon>
            </Group>
          </Group>
        </Stack>
      ))}
    </Stack>
  );
}
