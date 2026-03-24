import { Container } from "@mantine/core";
import TranscriptDetail from "@/components/transcripts/transcript-detail";

export default function TranscriptDetailPage({ params }) {
  return (
    <Container size="lg" py="xl">
      <TranscriptDetail transcriptId={params.transcriptId} />
    </Container>
  );
}
