import { Badge, Card, Stack, Text, Title } from "@mantine/core";

export default function QueuePanel() {
  return (
    <Card withBorder radius="md" p="md">
      <Title order={5} mb="sm">
        Processing Queue
      </Title>
      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          No files currently in queue.
        </Text>
        <Badge color="gray" variant="light">
          0 pending
        </Badge>
      </Stack>
    </Card>
  );
}
