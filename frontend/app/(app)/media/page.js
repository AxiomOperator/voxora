"use client";

import { Container, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import MediaList from "@/components/media/media-list";
import MediaSearchBar from "@/components/media/media-search-bar";
import UploadForm from "@/components/media/upload-form";

export default function MediaPage() {
  const [query, setQuery] = useState("");

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
        <MediaSearchBar onSearch={setQuery} />
        <MediaList query={query} />
      </Stack>
    </Container>
  );
}
