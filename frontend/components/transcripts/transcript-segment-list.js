import { Badge, Card, Group, Stack, Text } from "@mantine/core";

export default function TranscriptSegmentList({ segments }) {
  if (!segments || segments.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No segments available.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {segments.map((seg) => (
        <Card key={seg.id} withBorder radius="sm" p="sm">
          <Group justify="space-between" mb="xs" wrap="nowrap">
            <Group gap="xs">
              <Badge size="xs" variant="outline" color="gray">
                #{seg.segment_index}
              </Badge>
              <Text size="xs" c="dimmed">
                {formatTime(seg.start_seconds)} → {formatTime(seg.end_seconds)}
              </Text>
            </Group>
            {seg.speaker_label && (
              <Badge size="xs" variant="light">
                {seg.speaker_label}
              </Badge>
            )}
          </Group>
          <Text size="sm">{seg.text}</Text>
        </Card>
      ))}
    </Stack>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
