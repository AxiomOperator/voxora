"use client";

import {
  Alert,
  Anchor,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import ProjectForm from "@/components/projects/project-form";
import { deleteProject, getMedia, getProject } from "@/lib/api";

export default function ProjectDetailPage({ params }) {
  const { projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpened, editModal] = useDisclosure(false);

  useEffect(() => {
    Promise.all([getProject(projectId), getMedia({ project_id: projectId })])
      .then(([proj, media]) => {
        setProject(proj);
        setMediaFiles(media);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleDelete() {
    if (
      !confirm(
        `Delete project "${project?.name}"? This will not delete the media files.`,
      )
    )
      return;
    try {
      await deleteProject(projectId);
      notifications.show({ color: "green", message: "Project deleted" });
      router.push("/projects");
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message,
      });
    }
  }

  function handleSaved(updated) {
    setProject(updated);
    editModal.close();
  }

  if (loading) {
    return (
      <Center h="40vh">
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Error">
        {error}
      </Alert>
    );
  }

  if (!project) return null;

  return (
    <Stack gap="lg">
      <Group gap="xs" mb={0}>
        <Button
          component={Link}
          href="/projects"
          variant="subtle"
          size="xs"
          px={0}
        >
          ← Projects
        </Button>
      </Group>

      <Group justify="space-between" align="flex-start" wrap="wrap">
        <div>
          <Title order={2}>{project.name}</Title>
          {project.description && (
            <Text c="dimmed" mt="xs" maw={600}>
              {project.description}
            </Text>
          )}
          <Text size="xs" c="dimmed" mt="xs">
            Created {new Date(project.created_at).toLocaleString()}
          </Text>
        </div>
        <Group gap="sm">
          <Button variant="light" size="sm" onClick={editModal.open}>
            Edit
          </Button>
          <Button variant="light" color="red" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </Group>
      </Group>

      <div>
        <Title order={4} mb="sm">
          Media Files ({mediaFiles.length})
        </Title>
        {mediaFiles.length === 0
          ? <Text size="sm" c="dimmed">
              No media files in this project yet.
            </Text>
          : <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Uploaded</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mediaFiles.map((f) => (
                  <Table.Tr key={f.id}>
                    <Table.Td>
                      <Anchor
                        component={Link}
                        href={`/media/${f.id}`}
                        size="sm"
                      >
                        {f.original_name}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {f.mime_type}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light">
                        {f.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(f.created_at).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>}
      </div>

      <Modal
        opened={editModalOpened}
        onClose={editModal.close}
        title="Edit Project"
      >
        <ProjectForm
          project={project}
          onSaved={handleSaved}
          onCancel={editModal.close}
        />
      </Modal>
    </Stack>
  );
}
