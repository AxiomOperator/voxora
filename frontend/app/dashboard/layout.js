"use client";

import {
  ActionIcon,
  AppShell,
  Burger,
  Group,
  NavLink,
  Stack,
  Text,
  Title,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";

function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme("dark");

  return (
    <ActionIcon
      variant="default"
      size="lg"
      aria-label="Toggle color scheme"
      onClick={() => setColorScheme(computed === "dark" ? "light" : "dark")}
    >
      {computed === "dark" ? "☀" : "☾"}
    </ActionIcon>
  );
}

export default function DashboardLayout({ children, queue, recent, stats }) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Title
              order={3}
              component={Link}
              href="/"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              Voxora
            </Title>
          </Group>
          <ColorSchemeToggle />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
            Navigation
          </Text>
          <NavLink component={Link} href="/dashboard" label="Dashboard" />
          <NavLink component={Link} href="/dashboard" label="Media" />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
        <Stack gap="md" mt="md">
          {stats}
          <Group align="flex-start" grow>
            {queue}
            {recent}
          </Group>
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}
