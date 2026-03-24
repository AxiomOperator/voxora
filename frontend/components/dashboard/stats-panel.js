import { Card, Group, SimpleGrid, Text, ThemeIcon } from "@mantine/core";

const stats = [
  { label: "Total Files", value: "—", color: "blue" },
  { label: "Processing", value: "—", color: "yellow" },
  { label: "Completed", value: "—", color: "green" },
  { label: "Errors", value: "—", color: "red" },
];

export default function StatsPanel() {
  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }}>
      {stats.map((stat) => (
        <Card key={stat.label} withBorder radius="md" p="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              {stat.label}
            </Text>
            <ThemeIcon color={stat.color} variant="light" size="sm" radius="xl">
              <span />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {stat.value}
          </Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}
