"use client";

import { Container, Stack, Title } from "@mantine/core";
import { useState } from "react";
import JobFilters from "@/components/jobs/job-filters";
import JobList from "@/components/jobs/job-list";

export default function JobsPage() {
  const [filters, setFilters] = useState({ status: "all", search: "" });

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={2}>Transcription Jobs</Title>
        <JobFilters filters={filters} onChange={setFilters} />
        <JobList status={filters.status} search={filters.search} />
      </Stack>
    </Container>
  );
}
