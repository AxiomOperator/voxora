import { Group, Stack } from "@mantine/core";

export default function DashboardLayout({ children, queue, recent, stats }) {
  return (
    <>
      {children}
      <Stack gap="md" mt="md">
        {stats}
        <Group align="flex-start" grow>
          {queue}
          {recent}
        </Group>
      </Stack>
    </>
  );
}
