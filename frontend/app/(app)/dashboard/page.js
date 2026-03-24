import { Stack, Text, Title } from "@mantine/core";

export default function DashboardPage() {
  return (
    <Stack gap="md">
      <Title order={2}>Dashboard</Title>
      <Text c="dimmed">Overview of your transcription activity.</Text>
    </Stack>
  );
}
