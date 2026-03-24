"use client";

import { Badge, Card, Group, Skeleton, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { getDiagnostics, getSystemHealth } from "@/lib/api";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getSystemHealth(), getDiagnostics()]).then(
      ([healthRes, diagRes]) => {
        if (healthRes.status === "fulfilled") setHealth(healthRes.value);
        if (diagRes.status === "fulfilled") setDiag(diagRes.value);
        setLoading(false);
      },
    );
  }, []);

  const apiOk = health !== null;

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
              {diag && okBadge(diag.database === "ok", "DB")}
              {diag && okBadge(diag.storage === "ok", "Storage")}
              {diag && okBadge(diag.gpu_available === true, "GPU")}
            </Group>
            {!apiOk && (
              <Text size="xs" c="red">
                API unreachable
              </Text>
            )}
          </Stack>}
    </Card>
  );
}
