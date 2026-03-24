import { Container, Stack, Text, Title } from "@mantine/core";
import TranscriptList from "@/components/transcripts/transcript-list";

export const metadata = {
  title: "Transcripts — Voxora",
};

export default function TranscriptsPage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>Transcripts</Title>
          <Text c="dimmed" mt="xs">
            All completed transcriptions.
          </Text>
        </div>
        <TranscriptList />
      </Stack>
    </Container>
  );
}
