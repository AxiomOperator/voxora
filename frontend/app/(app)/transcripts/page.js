"use client";

import { Container, Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import TranscriptList from "@/components/transcripts/transcript-list";
import TranscriptSearchBar from "@/components/transcripts/transcript-search-bar";
import { getTranscripts } from "@/lib/api";

export default function TranscriptsPage() {
  const [query, setQuery] = useState("");
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTranscripts(query ? { q: query } : undefined)
      .then(setTranscripts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>Transcripts</Title>
          <Text c="dimmed" mt="xs">
            All completed transcriptions.
          </Text>
        </div>
        <TranscriptSearchBar onSearch={setQuery} />
        <TranscriptList items={transcripts} loading={loading} error={error} />
      </Stack>
    </Container>
  );
}
