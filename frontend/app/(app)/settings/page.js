"use client";
import { Stack, Tabs, Title } from "@mantine/core";
import DiarizationRuntimePanel from "@/components/settings/diarization-runtime-panel";
import { MetricsStatus } from "@/components/settings/metrics-status";
import { RuntimeInfo } from "@/components/settings/runtime-info";
import { SettingsForm } from "@/components/settings/settings-form";
import { SystemStatus } from "@/components/settings/system-status";
import TranscriptionRuntimePanel from "@/components/settings/transcription-runtime-panel";

export default function SettingsPage() {
  return (
    <Stack gap="xl">
      <Title order={2}>Settings</Title>
      <Tabs defaultValue="general">
        <Tabs.List>
          <Tabs.Tab value="general">General</Tabs.Tab>
          <Tabs.Tab value="runtime">Runtime</Tabs.Tab>
          <Tabs.Tab value="transcription">Transcription</Tabs.Tab>
          <Tabs.Tab value="diarization">Diarization</Tabs.Tab>
          <Tabs.Tab value="metrics">Metrics</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="md">
          <SettingsForm />
        </Tabs.Panel>

        <Tabs.Panel value="runtime" pt="md">
          <Stack gap="md">
            <RuntimeInfo />
            <SystemStatus />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="transcription" pt="md">
          <TranscriptionRuntimePanel />
        </Tabs.Panel>

        <Tabs.Panel value="diarization" pt="md">
          <DiarizationRuntimePanel />
        </Tabs.Panel>

        <Tabs.Panel value="metrics" pt="md">
          <MetricsStatus />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
