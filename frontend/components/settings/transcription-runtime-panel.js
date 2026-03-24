"use client";

import {
  Alert,
  Badge,
  Card,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { getRuntimeInfo, getTranscriptionRuntime } from "@/lib/api";

export default function TranscriptionRuntimePanel() {
  const [runtime, setRuntime] = useState(null);
  const [caps, setCaps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getRuntimeInfo(), getTranscriptionRuntime()])
      .then(([r, c]) => {
        setRuntime(r);
        setCaps(c);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton height={120} />;
  if (error)
    return (
      <Alert color="red" title="Failed to load runtime info">
        {error}
      </Alert>
    );

  const isGpu = runtime?.compute_device === "cuda";

  return (
    <Stack gap="md">
      <Group gap="sm" align="center">
        <Title order={5}>Transcription Runtime</Title>
        <Badge color={isGpu ? "green" : "orange"} variant="filled">
          {isGpu ? "⚡ GPU Active" : "🖥 CPU Mode"}
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
        <Card withBorder p="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Device
          </Text>
          <Text fw={600}>{runtime?.compute_device ?? "—"}</Text>
        </Card>
        <Card withBorder p="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            GPU
          </Text>
          <Text fw={600} size="sm">
            {runtime?.gpu_device_name ?? "Not available"}
          </Text>
        </Card>
        <Card withBorder p="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            CUDA Version
          </Text>
          <Text fw={600}>{runtime?.cuda_version ?? "N/A"}</Text>
        </Card>
        <Card withBorder p="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Model
          </Text>
          <Text fw={600}>{caps?.model_size ?? "—"}</Text>
        </Card>
        <Card withBorder p="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Compute Type
          </Text>
          <Text fw={600}>{caps?.compute_type ?? "—"}</Text>
        </Card>
        <Card withBorder p="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Beam Size
          </Text>
          <Text fw={600}>{caps?.beam_size ?? "—"}</Text>
        </Card>
      </SimpleGrid>

      {!runtime?.faster_whisper_available && (
        <Alert color="yellow" title="faster-whisper not detected">
          Transcription may not work. Install faster-whisper in the backend.
        </Alert>
      )}
    </Stack>
  );
}
