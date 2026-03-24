import { Badge, Card, Group, Text } from "@mantine/core";

export default function JobStatusCard({ job }) {
  return (
    <Card withBorder radius="sm" p="sm">
      <Group justify="space-between">
        <div>
          <Text size="sm" fw={500}>
            Job #{job.id} — Media #{job.media_file_id}
          </Text>
          <Text size="xs" c="dimmed">
            {new Date(job.created_at).toLocaleString()}
          </Text>
        </div>
        <Badge color={statusColor(job.status)} variant="light" size="sm">
          {job.status}
        </Badge>
      </Group>
    </Card>
  );
}

function statusColor(status) {
  switch (status) {
    case "done":
      return "green";
    case "processing":
      return "yellow";
    case "error":
      return "red";
    default:
      return "gray";
  }
}
