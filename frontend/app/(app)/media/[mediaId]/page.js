import { Container } from "@mantine/core";
import MediaDetail from "@/components/media/media-detail";

export default async function MediaDetailPage({ params }) {
  const { mediaId } = await params;
  return (
    <Container size="lg" py="xl">
      <MediaDetail mediaId={mediaId} />
    </Container>
  );
}
