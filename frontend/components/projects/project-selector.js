"use client";

import { Select } from "@mantine/core";
import { useEffect, useState } from "react";
import { getProjects } from "@/lib/api";

export default function ProjectSelector({ value, onChange }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => {});
  }, []);

  const data = [
    { value: "", label: "No project" },
    ...projects.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  return (
    <Select
      label="Project"
      data={data}
      value={value ? String(value) : ""}
      onChange={(v) => onChange?.(v || null)}
      clearable
      placeholder="No project"
    />
  );
}
