"use client";

import {
  Alert,
  Badge,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { checkMetricsAvailability } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/env";

export function MetricsStatus() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const baseUrl = getApiBaseUrl();
  const metricsUrl = `${baseUrl}/metrics`;

  useEffect(() => {
    checkMetricsAvailability(baseUrl)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [baseUrl]);

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Title order={4}>Prometheus Metrics</Title>
        {loading && <Skeleton height={60} radius="sm" />}
        {result && (
          <Stack gap="xs">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>
                Endpoint Status
              </Text>
              <Badge
                color={result.available ? "green" : "red"}
                variant="light"
                size="md"
              >
                {result.available ? "Available" : "Unavailable"}
                {result.status ? ` (${result.status})` : ""}
              </Badge>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={2}>
                URL
              </Text>
              <Text size="sm" ff="monospace">
                {metricsUrl}
              </Text>
            </div>
            {!result.available && (
              <Alert color="yellow" title="Note" radius="sm">
                The metrics endpoint may be unreachable due to CORS restrictions
                in the browser. Prometheus scraping directly from the server
                side is unaffected.
              </Alert>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
