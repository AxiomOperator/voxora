"use client";

import { Box, Text } from "@mantine/core";
import { getApiBaseUrl } from "@/lib/env";

export default function MediaAudioPlayer({ mediaId, mimeType }) {
  if (!mediaId) return null;

  const src = `${getApiBaseUrl()}/api/v1/media/${mediaId}/stream`;

  return (
    <Box>
      {mimeType && (
        <Text size="xs" c="dimmed" mb="xs">
          {mimeType}
        </Text>
      )}
      {/* biome-ignore lint/a11y/useMediaCaption: captions not available for user-uploaded media */}
      <audio controls style={{ width: "100%" }} src={src} preload="metadata">
        Your browser does not support the audio element.
      </audio>
    </Box>
  );
}
