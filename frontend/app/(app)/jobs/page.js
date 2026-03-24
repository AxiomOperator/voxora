"use client";

import { Container, Select, Stack, Title } from "@mantine/core";
import { useState } from "react";
import JobList from "@/components/jobs/job-list";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export default function JobsPage() {
  const [status, setStatus] = useState("all");

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={2}>Transcription Jobs</Title>
        <Select
          label="Filter by status"
          data={STATUS_OPTIONS}
          value={status}
          onChange={(v) => setStatus(v ?? "all")}
          w={200}
        />
        <JobList status={status} />
      </Stack>
    </Container>
  );
}
