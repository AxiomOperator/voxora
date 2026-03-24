"use client";

import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { retryJob } from "@/lib/api";

export default function RetryJobButton({ jobId, onRetried }) {
  const [loading, setLoading] = useState(false);

  async function handleRetry() {
    setLoading(true);
    try {
      await retryJob(jobId);
      notifications.show({
        color: "green",
        title: "Success",
        message: "Job queued for retry",
      });
      if (onRetried) onRetried();
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
    <Button
      color="orange"
      variant="light"
      size="xs"
      loading={loading}
      onClick={handleRetry}
    >
      Retry
    </Button>
  );
}
