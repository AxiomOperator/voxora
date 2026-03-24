"use client";

import { Button, Group, Paper, Stack, Text } from "@mantine/core";

function formatTime(s) {
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;
}

export default function ChapterList({ chapters = [], onEdit, onDelete }) {
  if (chapters.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No chapters yet.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {chapters.map((ch) => (
        <Paper key={ch.id} withBorder p="xs" radius="sm">
          <Group justify="space-between" wrap="nowrap">
            <div>
              <Text size="sm" fw={500}>
                {ch.title}
              </Text>
              <Text size="xs" c="dimmed">
                {formatTime(ch.start_seconds)}–{formatTime(ch.end_seconds)}
              </Text>
            </div>
            <Group gap="xs">
              <Button variant="subtle" size="xs" onClick={() => onEdit(ch)}>
                Edit
              </Button>
              <Button
                variant="subtle"
                size="xs"
                color="red"
                onClick={() => onDelete(ch.id)}
              >
                Delete
              </Button>
            </Group>
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
