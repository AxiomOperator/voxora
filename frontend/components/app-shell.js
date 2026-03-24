"use client";

import { AppShell, Group, Title } from "@mantine/core";
import Link from "next/link";

/**
 * BaseAppShell — a thin wrapper around Mantine AppShell.
 * Dashboard layout composes this directly via its own layout.js.
 * Extended in later phases for authenticated or multi-section layouts.
 */
export default function BaseAppShell({ children, header, navbar }) {
  return (
    <AppShell header={{ height: 60 }} navbar={navbar} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md">
          <Title
            order={3}
            component={Link}
            href="/"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            Voxora
          </Title>
          {header}
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
