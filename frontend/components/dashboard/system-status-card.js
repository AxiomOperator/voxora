"use client";

import { Badge, Card, Group, Skeleton, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { getDiagnostics, getRuntimeInfo, getSystemHealth } from "@/lib/api";

function okBadge(ok, label) {
  return (
    <Badge color={ok ? "green" : "red"} variant="dot" size="xs">
      {label}
    </Badge>
  );
}

export function SystemStatusCard() {
  const [health, setHealth] = useState(null);
  const [diag, setDiag] = useState(null);
  const [runtime, setRuntime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getSystemHealth(),
      getDiagnostics(),
      getRuntimeInfo(),
    ]).then(([healthRes, diagRes, runtimeRes]) => {
      if (healthRes.status === "fulfilled") setHealth(healthRes.value);
      if (diagRes.status === "fulfilled") setDiag(diagRes.value);
      if (runtimeRes.status === "fulfilled") setRuntime(runtimeRes.value);
      setLoading(false);
    });
  }, []);

  const apiOk = health !== null;
  const gpuActive = runtime?.compute_device === "cuda";
  const gpuLabel = gpuActive
    ? `Active${runtime?.gpu_device_name ? ` (${runtime.gpu_device_name})` : ""}`
    : "Not available";

  return (
    <Card withBorder radius="md" p="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">
        System Health
      </Text>
      {loading
        ? <Skeleton height={28} />
        : <Stack gap={4}>
            <Group gap="xs">
              {okBadge(apiOk, "API")}
              {diag && okBadge(diag.database?.status === "ok", "DB")}
              {diag && okBadge(diag.storage?.status === "ok", "Storage")}
              {diag && okBadge(diag.gpu?.available === true, "GPU")}
            </Group>
            {!apiOk && (
              <Text size="xs" c="red">
                API unreachable
              </Text>
            )}
            {runtime && (
              <Group gap="xs">
                <Text size="xs" c="dimmed">
                  GPU:
                </Text>
                <Text size="xs" c={gpuActive ? "green" : "orange"} fw={500}>
                  {gpuLabel}
                </Text>
              </Group>
            )}
          </Stack>}
    </Card>
  );
}
