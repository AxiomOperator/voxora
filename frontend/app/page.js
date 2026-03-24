import { Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";

export default function HomePage() {
  return (
    <Container size="md" py="xl" mt={60}>
      <Stack align="center" gap="lg">
        <Title order={1}>Voxora</Title>
        <Text size="xl" c="dimmed" ta="center">
          AI-powered transcription for your media files
        </Text>
        <Text size="md" ta="center" maw={520}>
          Upload audio and video files and get accurate, GPU-accelerated
          transcriptions with speaker diarization — fast.
        </Text>
        <Group>
          <Link href="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        </Group>
      </Stack>
    </Container>
  );
}
