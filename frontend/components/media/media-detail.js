"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProjectSelector from "@/components/projects/project-selector";
import { createJob, getJobs, getMediaItem, updateMedia } from "@/lib/api";
import MediaAudioPlayer from "./media-audio-player";

export default function MediaDetail({ mediaId }) {
  const [media, setMedia] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getMediaItem(mediaId),
      getJobs().then((all) =>
        all.filter((j) => j.media_file_id === Number(mediaId)),
      ),
    ])
      .then(([mediaData, jobData]) => {
        setMedia(mediaData);
        setJobs(jobData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [mediaId]);

  async function handleStartJob() {
    setSubmitting(true);
    setError(null);
    try {
      const job = await createJob(Number(mediaId));
      setJobs((prev) => [job, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProjectChange(projectId) {
    try {
      const updated = await updateMedia(mediaId, {
        project_id: projectId ? Number(projectId) : null,
      });
      setMedia((prev) => ({ ...prev, project_id: updated.project_id }));
      notifications.show({ color: "green", message: "Project updated" });
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message,
      });
    }
  }

  if (loading) {
    return (
      <Center h="40vh">
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Error">
        {error}
      </Alert>
    );
  }

  if (!media) return null;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>{media.original_name}</Title>
          <Text c="dimmed" size="sm" mt="xs">
            {media.mime_type} · {formatBytes(media.size_bytes)}
          </Text>
        </div>
        <Badge color={statusColor(media.status)} size="lg">
          {media.status}
        </Badge>
      </Group>

      <MediaAudioPlayer mediaId={media.id} mimeType={media.mime_type} />

      <Card withBorder radius="md" p="md">
        <ProjectSelector
          value={media.project_id ?? null}
          onChange={handleProjectChange}
        />
      </Card>

      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="sm">
          <Title order={5}>Transcription Jobs</Title>
          <Button size="sm" onClick={handleStartJob} loading={submitting}>
            Start Transcription
          </Button>
        </Group>

        {jobs.length === 0
          ? <Text size="sm" c="dimmed">
              No transcription jobs yet. Click &ldquo;Start Transcription&rdquo;
              to begin.
            </Text>
          : <Stack gap="xs">
              {jobs.map((job) => (
                <JobStatusCard key={job.id} job={job} />
              ))}
            </Stack>}
      </Card>

      <Text size="sm" c="dimmed">
        Uploaded {new Date(media.created_at).toLocaleString()}
      </Text>
    </Stack>
  );
}

function JobStatusCard({ job }) {
  return (
    <Card withBorder radius="sm" p="sm">
      <Group justify="space-between">
        <div>
          <Text size="sm" fw={500}>
            Job #{job.id}
          </Text>
          <Text size="xs" c="dimmed">
            {new Date(job.created_at).toLocaleString()}
          </Text>
        </div>
        <Group gap="xs">
          <Badge color={jobStatusColor(job.status)} variant="light" size="sm">
            {job.status}
          </Badge>
          {job.status === "completed" && job.transcript_id && (
            <Button
              component={Link}
              href={`/transcripts/${job.transcript_id}`}
              size="xs"
              variant="filled"
              color="green"
            >
              View Transcript
            </Button>
          )}
        </Group>
      </Group>
      {job.status === "failed" && job.error_message && (
        <Alert color="red" mt="xs" py="xs" px="sm">
          {job.error_message}
        </Alert>
      )}
    </Card>
  );
}

function jobStatusColor(status) {
  switch (status) {
    case "completed":
      return "green";
    case "processing":
      return "yellow";
    case "failed":
      return "red";
    default:
      return "gray";
  }
}

function statusColor(status) {
  switch (status) {
    case "done":
      return "green";
    case "processing":
      return "yellow";
    case "error":
      return "red";
    default:
      return "gray";
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
