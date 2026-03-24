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
import { getDiagnostics } from "@/lib/api";

function statusBadge(val, okLabel = "ok", errLabel = "error") {
  const ok = val === "ok" || val === true;
  return (
    <Badge color={ok ? "green" : "red"} variant="light" size="sm">
      {ok ? okLabel : errLabel}
    </Badge>
  );
}

export function SystemStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDiagnostics()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Title order={4}>System Status</Title>
        {loading && <Skeleton height={80} radius="sm" />}
        {error && (
          <Alert color="orange" title="Status unavailable">
            {error}
          </Alert>
        )}
        {data && (
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={2}>
                Database
              </Text>
              {statusBadge(data.database)}
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={2}>
                Storage
              </Text>
              {statusBadge(data.storage)}
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={2}>
                GPU
              </Text>
              {statusBadge(data.gpu_available, "yes", "no")}
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={2}>
                Runtime
              </Text>
              <Text size="sm">
                {data.model ?? data.transcription_model ?? "—"}
                {data.device ? ` · ${data.device}` : ""}
              </Text>
            </div>
          </SimpleGrid>
        )}
      </Stack>
    </Paper>
  );
}
