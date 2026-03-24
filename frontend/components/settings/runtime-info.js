"use client";
import {
  Alert,
  Badge,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { getRuntimeInfo } from "@/lib/api";

export function RuntimeInfo() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getRuntimeInfo()
      .then(setInfo)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Title order={4}>Transcription Engine</Title>
        {loading && <Skeleton height={80} radius="sm" />}
        {error && (
          <Alert color="orange" title="Runtime info unavailable">
            {error}
          </Alert>
        )}
        {info && (
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={2}>
                Model Size
              </Text>
              <Badge variant="light" size="sm">
                {info.model_size ?? "—"}
              </Badge>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={2}>
                Device
              </Text>
              <Badge
                color={info.compute_device === "cuda" ? "green" : "gray"}
                variant="light"
                size="sm"
              >
                {info.compute_device ?? "—"}
              </Badge>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={2}>
                Compute Type
              </Text>
              <Badge variant="outline" size="sm">
                {info.compute_type ?? "—"}
              </Badge>
            </div>
          </SimpleGrid>
        )}
      </Stack>
    </Paper>
  );
}
