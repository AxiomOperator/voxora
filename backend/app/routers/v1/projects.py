from typing import List

from fastapi import APIRouter
from fastapi.responses import Response

from app.dependencies import SessionDep
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectRead
from app.services import project_service

router = APIRouter()


@router.get("", response_model=List[ProjectRead])
def list_projects(session: SessionDep):
    return project_service.get_projects(session)


@router.post("", response_model=ProjectRead, status_code=201)
def create_project(payload: ProjectCreate, session: SessionDep):
    return project_service.create_project(session, payload)


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, session: SessionDep):
    return project_service.get_project(session, project_id)


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, payload: ProjectUpdate, session: SessionDep):
    return project_service.update_project(session, project_id, payload)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, session: SessionDep):
    project_service.delete_project(session, project_id)
    return Response(status_code=204)
