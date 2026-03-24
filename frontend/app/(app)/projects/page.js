"use client";

import {
  Alert,
  Button,
  Container,
  Group,
  Modal,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import ProjectForm from "@/components/projects/project-form";
import ProjectList from "@/components/projects/project-list";
import { deleteProject, getProjects } from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [modalOpened, modal] = useDisclosure(false);

  function loadProjects() {
    setLoading(true);
    setError(null);
    getProjects()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadProjects is a stable function with no deps
  useEffect(() => {
    loadProjects();
  }, []);

  function handleNew() {
    setEditingProject(null);
    modal.open();
  }

  function handleEdit(project) {
    setEditingProject(project);
    modal.open();
  }

  function handleSaved() {
    modal.close();
    loadProjects();
  }

  async function handleDelete(project) {
    if (!confirm(`Delete project "${project.name}"?`)) return;
    try {
      await deleteProject(project.id);
      loadProjects();
      notifications.show({ color: "green", message: "Project deleted" });
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message,
      });
    }
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>Projects</Title>
            <Text c="dimmed" mt="xs">
              Organise your media files into projects.
            </Text>
          </div>
          <Button onClick={handleNew}>+ New Project</Button>
        </Group>

        {error && (
          <Alert color="red" title="Failed to load projects">
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <ProjectList
            projects={projects}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Stack>

      <Modal
        opened={modalOpened}
        onClose={modal.close}
        title={editingProject ? "Edit Project" : "New Project"}
      >
        <ProjectForm
          project={editingProject}
          onSaved={handleSaved}
          onCancel={modal.close}
        />
      </Modal>
    </Container>
  );
}
