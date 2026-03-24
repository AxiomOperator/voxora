"use client";

import { Button, Group, Stack, Textarea, TextInput } from "@mantine/core";
import { useState } from "react";
import { createProject, updateProject } from "@/lib/api";

export default function ProjectForm({ project, onSaved, onCancel }) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    setNameError("");
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
      };
      const saved = project
        ? await updateProject(project.id, data)
        : await createProject(data);
      onSaved?.(saved);
    } catch (err) {
      setNameError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          placeholder="Project name"
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={3}
        />
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {project ? "Save Changes" : "Create Project"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
