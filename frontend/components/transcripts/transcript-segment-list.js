import { Badge, Card, Divider, Group, Stack, Text } from "@mantine/core";

export default function TranscriptSegmentList({
  segments,
  onSeek,
  currentTime,
}) {
  if (!segments || segments.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No segments available.
      </Text>
    );
  }

  // Group consecutive segments by same speaker
  const groups = [];
  for (const seg of segments) {
    const last = groups[groups.length - 1];
    if (last && last.speaker === (seg.speaker_label ?? null)) {
      last.segments.push(seg);
    } else {
      groups.push({
        speaker: seg.speaker_label ?? null,
        segments: [seg],
        firstId: seg.id,
      });
    }
  }

  return (
    <Stack gap="xs">
      {groups.map((group, gi) => (
        <Stack key={`${group.firstId}-${group.speaker ?? "none"}`} gap={4}>
          {gi > 0 && <Divider my="xs" />}
          {group.speaker && (
            <Text size="xs" fw={700} c="blue" tt="uppercase" px="xs">
              {group.speaker}
            </Text>
          )}
          {group.segments.map((seg) => {
            const isActive =
              currentTime != null &&
              currentTime >= seg.start_seconds &&
              currentTime < seg.end_seconds;
            return (
              <Card
                key={seg.id}
                withBorder
                radius="sm"
                p="sm"
                style={{
                  cursor: onSeek ? "pointer" : undefined,
                  backgroundColor: isActive
                    ? "var(--mantine-color-yellow-0)"
                    : undefined,
                  borderColor: isActive
                    ? "var(--mantine-color-yellow-5)"
                    : undefined,
                }}
                onClick={onSeek ? () => onSeek(seg.start_seconds) : undefined}
              >
                <Group justify="space-between" mb="xs" wrap="nowrap">
                  <Group gap="xs">
                    <Badge size="xs" variant="outline" color="gray">
                      #{seg.segment_index}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {formatTime(seg.start_seconds)} →{" "}
                      {formatTime(seg.end_seconds)}
                    </Text>
                  </Group>
                  {seg.speaker_label && !group.speaker && (
                    <Badge size="xs" variant="light">
                      {seg.speaker_label}
                    </Badge>
                  )}
                </Group>
                <Text size="sm">{seg.text}</Text>
              </Card>
            );
          })}
        </Stack>
      ))}
    </Stack>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
