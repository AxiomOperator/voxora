import { Badge, Tooltip } from "@mantine/core";

export default function DiarizationStatusBadge({
  diarizationEnabled,
  diarizationStatus,
  diarizationBackend,
  diarizationError,
}) {
  if (diarizationError) {
    return (
      <Tooltip label={diarizationError} withArrow>
        <Badge color="red" variant="light" size="sm">
          Diarization failed
        </Badge>
      </Tooltip>
    );
  }

  if (!diarizationEnabled) {
    return (
      <Badge color="orange" variant="light" size="sm">
        No diarization
      </Badge>
    );
  }

  if (diarizationStatus === "done" || diarizationStatus === "completed") {
    return (
      <Tooltip
        label={
          diarizationBackend
            ? `Backend: ${diarizationBackend}`
            : "Speaker diarization applied"
        }
        withArrow
      >
        <Badge color="green" variant="light" size="sm">
          Diarized
        </Badge>
      </Tooltip>
    );
  }

  return (
    <Badge color="blue" variant="light" size="sm">
      {diarizationStatus ?? "Diarization pending"}
    </Badge>
  );
}
