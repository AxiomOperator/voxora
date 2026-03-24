"use client";

import { Select } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { updateTranscript } from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "reviewed", label: "Reviewed" },
  { value: "exported", label: "Exported" },
];

function statusColor(status) {
  switch (status) {
    case "in_review":
      return "yellow";
    case "reviewed":
      return "green";
    case "exported":
      return "blue";
    default:
      return "gray";
  }
}

export default function ReviewStatusControl({
  transcriptId,
  currentStatus,
  onUpdated,
}) {
  const [status, setStatus] = useState(currentStatus ?? "draft");
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus) {
    if (!newStatus || newStatus === status) return;
    setLoading(true);
    try {
      const updated = await updateTranscript(transcriptId, {
        review_status: newStatus,
      });
      setStatus(newStatus);
      notifications.show({ color: "green", message: "Review status updated" });
      onUpdated?.(updated);
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select
      data={STATUS_OPTIONS}
      value={status}
      onChange={handleChange}
      disabled={loading}
      size="xs"
      w={130}
      styles={{
        input: {
          color: `var(--mantine-color-${statusColor(status)}-6)`,
          fontWeight: 600,
          borderColor: `var(--mantine-color-${statusColor(status)}-3)`,
        },
      }}
    />
  );
}
