"use client";

import { ActionIcon, TextInput } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

export default function TranscriptSearchBar({ onSearch }) {
  const [value, setValue] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(e) {
    const q = e.target.value;
    setValue(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(q);
    }, 500);
  }

  function handleClear() {
    setValue("");
    if (timerRef.current) clearTimeout(timerRef.current);
    onSearch("");
  }

  return (
    <TextInput
      placeholder="Search transcripts..."
      value={value}
      onChange={handleChange}
      rightSection={
        value
          ? <ActionIcon
              variant="transparent"
              size="sm"
              onClick={handleClear}
              aria-label="Clear search"
            >
              ✕
            </ActionIcon>
          : null
      }
    />
  );
}
