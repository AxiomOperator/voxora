import { Container } from "@mantine/core";
import MediaDetail from "@/components/media/media-detail";

export default function MediaDetailPage({ params }) {
  return (
    <Container size="lg" py="xl">
      <MediaDetail mediaId={params.mediaId} />
    </Container>
  );
}
