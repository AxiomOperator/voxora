import { Container, Stack, Text, Title } from "@mantine/core";
import MediaList from "@/components/media/media-list";
import UploadForm from "@/components/media/upload-form";

export const metadata = {
  title: "Media — Voxora",
};

export default function MediaPage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>Media Files</Title>
          <Text c="dimmed" mt="xs">
            Upload audio or video files to transcribe.
          </Text>
        </div>
        <UploadForm />
        <MediaList />
      </Stack>
    </Container>
  );
}
