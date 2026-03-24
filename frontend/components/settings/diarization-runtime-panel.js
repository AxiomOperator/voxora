"use client";

import {
  Alert,
  Badge,
  Card,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { getRuntimeInfo, getSettings } from "@/lib/api";

export default function DiarizationRuntimePanel() {
  const [runtime, setRuntime] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getRuntimeInfo(), getSettings()])
      .then(([r, s]) => {
        setRuntime(r);
        setSettings(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton height={120} />;
  if (error)
    return (
      <Alert color="red" title="Failed to load diarization info">
        {error}
      </Alert>
    );

  const available = runtime?.diarization_available === true;

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Title order={5}>Diarization Runtime</Title>
        <Badge
          color={available ? "green" : "orange"}
          variant="filled"
          w="fit-content"
        >
          {available ? "Available" : "Not configured"}
        </Badge>
      </Stack>

      <Card withBorder p="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>
          Backend
        </Text>
        <Text fw={600}>{runtime?.diarization_backend ?? "—"}</Text>
      </Card>

      <Card withBorder p="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>
          Enabled by Default
        </Text>
        <Badge
          variant="light"
          color={settings?.diarization_enabled ? "green" : "gray"}
        >
          {settings?.diarization_enabled ? "Yes" : "No"}
        </Badge>
      </Card>

      {!available && (
        <Alert color="orange" title="Diarization not available">
          Install pyannote.audio or configure the heuristic backend to enable
          speaker diarization.
        </Alert>
      )}
    </Stack>
  );
}
