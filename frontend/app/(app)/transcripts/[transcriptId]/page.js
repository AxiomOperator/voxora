import { Container } from "@mantine/core";
import TranscriptDetail from "@/components/transcripts/transcript-detail";

export default async function TranscriptDetailPage({ params }) {
  const { transcriptId } = await params;
  return (
    <Container size="lg" py="xl">
      <TranscriptDetail transcriptId={transcriptId} />
    </Container>
  );
}
