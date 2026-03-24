"use client";

import {
  Anchor,
  Badge,
  Card,
  Divider,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getMedia, getTranscripts } from "@/lib/api";

export default function RecentPanel() {
  const [files, setFiles] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [reviewed, setReviewed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMedia(), getTranscripts()])
      .then(([media, txs]) => {
        setFiles(media.slice(0, 5));
        setTranscripts(txs.slice(0, 5));
        setReviewed(
          txs
            .filter(
              (t) =>
                t.review_status === "reviewed" ||
                t.review_status === "exported",
            )
            .slice(0, 5),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card withBorder radius="md" p="md" style={{ minWidth: 0 }}>
      <Title order={5} mb="sm">
        Recent Activity
      </Title>
      {loading
        ? <Stack gap="xs">
            <Skeleton height={20} />
            <Skeleton height={20} />
            <Skeleton height={20} />
          </Stack>
        : <Stack gap="md">
            <div>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                Recent Media
              </Text>
              {files.length === 0
                ? <Text size="sm" c="dimmed">
                    No media files yet.
                  </Text>
                : <Stack gap={4}>
                    {files.map((f) => (
                      <Anchor
                        key={f.id}
                        component={Link}
                        href={`/media/${f.id}`}
                        size="sm"
                        truncate
                      >
                        {f.original_name}
                      </Anchor>
                    ))}
                  </Stack>}
            </div>
            <Divider />
            <div>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                Recent Transcripts
              </Text>
              {transcripts.length === 0
                ? <Text size="sm" c="dimmed">
                    No transcripts yet.
                  </Text>
                : <Stack gap={4}>
                    {transcripts.map((t) => (
                      <Anchor
                        key={t.id}
                        component={Link}
                        href={`/transcripts/${t.id}`}
                        size="sm"
                      >
                        Transcript #{t.id}
                      </Anchor>
                    ))}
                  </Stack>}
            </div>
            <Divider />
            <div>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                Recently Reviewed
              </Text>
              {reviewed.length === 0
                ? <Text size="sm" c="dimmed">
                    No reviewed transcripts yet.
                  </Text>
                : <Stack gap={4}>
                    {reviewed.map((t) => (
                      <Anchor
                        key={t.id}
                        component={Link}
                        href={`/transcripts/${t.id}`}
                        size="sm"
                      >
                        <Badge
                          size="xs"
                          color={
                            t.review_status === "exported" ? "blue" : "green"
                          }
                          variant="light"
                          mr={4}
                        >
                          {t.review_status}
                        </Badge>
                        Transcript #{t.id}
                      </Anchor>
                    ))}
                  </Stack>}
            </div>
          </Stack>}
    </Card>
  );
}
