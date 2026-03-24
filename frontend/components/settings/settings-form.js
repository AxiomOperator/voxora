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
import { getSettings } from "@/lib/api";

function SettingRow({ label, value, badge }) {
  return (
    <div>
      <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={2}>
        {label}
      </Text>
      {badge
        ? <Badge variant="light" size="sm">
            {value ?? "—"}
          </Badge>
        : <Text size="sm">{value ?? "—"}</Text>}
    </div>
  );
}

export function SettingsForm() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton height={200} radius="md" />;
  if (error)
    return (
      <Alert color="red" title="Failed to load settings">
        {error}
      </Alert>
    );

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Title order={4}>Application Settings</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          <SettingRow label="App Name" value={settings?.app_name} />
          <SettingRow label="Environment" value={settings?.environment} badge />
          <SettingRow label="Storage Directory" value={settings?.storage_dir} />
          <SettingRow label="Database URL" value={settings?.database_url} />
          <SettingRow
            label="Transcription Model"
            value={settings?.transcription_model}
            badge
          />
          <SettingRow
            label="Default Language"
            value={settings?.default_language ?? "auto-detect"}
          />
        </SimpleGrid>
        <Text size="xs" c="dimmed" mt="xs">
          Settings are configured via environment variables. See .env.example
          for available options. Model options: base, small, medium, large-v2.
        </Text>
      </Stack>
    </Paper>
  );
}
