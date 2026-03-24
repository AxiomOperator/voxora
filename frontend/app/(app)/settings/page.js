"use client";
import { Stack, Title } from "@mantine/core";
import { RuntimeInfo } from "@/components/settings/runtime-info";
import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  return (
    <Stack gap="xl">
      <Title order={2}>Settings</Title>
      <RuntimeInfo />
      <SettingsForm />
    </Stack>
  );
}
