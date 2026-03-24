import { Card, Title } from "@mantine/core";
import MediaList from "@/components/media/media-list";

export default function RecentPanel() {
  return (
    <Card withBorder radius="md" p="md">
      <Title order={5} mb="sm">
        Recent Transcriptions
      </Title>
      <MediaList />
    </Card>
  );
}
