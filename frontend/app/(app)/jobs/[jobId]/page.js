"use client";

import { Alert, Center, Container, Loader, Stack } from "@mantine/core";
import { use, useCallback, useEffect, useState } from "react";
import JobDetail from "@/components/jobs/job-detail";
import { JobRuntimePanel } from "@/components/jobs/job-runtime-panel";
import { getJob } from "@/lib/api";

export default function JobDetailPage({ params }) {
  const { jobId } = use(params);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getJob(jobId)
      .then(setJob)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Center h="40vh">
        <Loader />
      </Center>
    );
  }

  if (error) {
    const isNotFound = error.includes("404");
    return (
      <Alert
        color={isNotFound ? "gray" : "red"}
        title={isNotFound ? "Job not found" : "Error"}
      >
        {isNotFound
          ? `Job #${jobId} does not exist or has been removed.`
          : error}
      </Alert>
    );
  }

  if (!job) return null;

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <JobDetail job={job} onRefresh={load} />
        <JobRuntimePanel job={job} onRefresh={load} />
      </Stack>
    </Container>
  );
}
