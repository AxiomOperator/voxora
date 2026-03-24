"use client";

import { Container, Group, Select, Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import TranscriptList from "@/components/transcripts/transcript-list";
import TranscriptSearchBar from "@/components/transcripts/transcript-search-bar";
import { getTranscripts } from "@/lib/api";

const REVIEW_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "reviewed", label: "Reviewed" },
  { value: "exported", label: "Exported" },
];

export default function TranscriptsPage() {
  const [query, setQuery] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (query) params.q = query;
    if (reviewStatus) params.review_status = reviewStatus;
    getTranscripts(Object.keys(params).length ? params : undefined)
      .then(setTranscripts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query, reviewStatus]);

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>Transcripts</Title>
          <Text c="dimmed" mt="xs">
            All completed transcriptions.
          </Text>
        </div>
        <Group gap="sm" wrap="wrap">
          <TranscriptSearchBar onSearch={setQuery} />
          <Select
            label="Review status"
            data={REVIEW_STATUS_OPTIONS}
            value={reviewStatus}
            onChange={(v) => setReviewStatus(v ?? "")}
            w={160}
            clearable
          />
        </Group>
        <TranscriptList items={transcripts} loading={loading} error={error} />
      </Stack>
    </Container>
  );
}
