"use client";

import { Group, Select, TextInput } from "@mantine/core";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export default function JobFilters({ filters, onChange }) {
  const status = filters?.status ?? "all";
  const search = filters?.search ?? "";

  return (
    <Group gap="sm" wrap="wrap">
      <Select
        label="Status"
        data={STATUS_OPTIONS}
        value={status}
        onChange={(v) => onChange?.({ ...filters, status: v ?? "all" })}
        w={160}
      />
      <TextInput
        label="Search"
        placeholder="Media name..."
        value={search}
        onChange={(e) => onChange?.({ ...filters, search: e.target.value })}
        w={220}
      />
    </Group>
  );
}
