"use client";

import { ActionIcon, Anchor, Group, Stack, Table, Text } from "@mantine/core";
import Link from "next/link";

export default function ProjectList({ projects, onEdit, onDelete }) {
  if (!projects || projects.length === 0) {
    return (
      <Stack align="center" py="xl" gap="xs">
        <Text size="lg">📁</Text>
        <Text fw={500}>No projects yet.</Text>
        <Text size="sm" c="dimmed">
          Create a project to organise your media files.
        </Text>
      </Stack>
    );
  }

  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Description</Table.Th>
          <Table.Th>Created</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {projects.map((p) => (
          <Table.Tr key={p.id}>
            <Table.Td>
              <Anchor component={Link} href={`/projects/${p.id}`} size="sm">
                {p.name}
              </Anchor>
            </Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed" lineClamp={1} maw={300}>
                {p.description || "—"}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed">
                {new Date(p.created_at).toLocaleDateString()}
              </Text>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => onEdit?.(p)}
                  aria-label="Edit project"
                >
                  ✏️
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => onDelete?.(p)}
                  aria-label="Delete project"
                >
                  🗑️
                </ActionIcon>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
