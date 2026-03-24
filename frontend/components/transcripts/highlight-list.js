"use client";

import { Button, Group, Paper, Stack, Text } from "@mantine/core";

export default function HighlightList({ highlights = [], onDelete }) {
  if (highlights.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No highlights yet.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {highlights.map((h) => (
        <Paper key={h.id} withBorder p="xs" radius="sm">
          <Group justify="space-between" wrap="nowrap" align="flex-start">
            <div>
              <Text size="sm">{h.note || "No note"}</Text>
              <Text size="xs" c="dimmed">
                {new Date(h.created_at).toLocaleString()}
              </Text>
            </div>
            <Button
              variant="subtle"
              size="xs"
              color="red"
              onClick={() => onDelete(h.id)}
            >
              Delete
            </Button>
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
