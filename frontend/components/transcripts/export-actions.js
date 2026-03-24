"use client";

import { Button, Menu } from "@mantine/core";
import { getExportUrl } from "@/lib/api";

export default function ExportActions({ transcriptId }) {
  function download(format) {
    const url = getExportUrl(transcriptId, format);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript_${transcriptId}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <Menu shadow="md" width={160}>
      <Menu.Target>
        <Button variant="light" size="sm">
          Export ▾
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Download as</Menu.Label>
        <Menu.Item onClick={() => download("txt")}>Plain Text (.txt)</Menu.Item>
        <Menu.Item onClick={() => download("srt")}>SubRip (.srt)</Menu.Item>
        <Menu.Item onClick={() => download("vtt")}>WebVTT (.vtt)</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
