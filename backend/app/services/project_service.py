from datetime import datetime
from typing import List

from fastapi import HTTPException
from sqlmodel import Session, select

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


def get_projects(session: Session) -> List[Project]:
    return session.exec(select(Project).order_by(Project.name)).all()


def get_project(session: Session, project_id: int) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def create_project(session: Session, data: ProjectCreate) -> Project:
    project = Project(**data.model_dump())
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def update_project(session: Session, project_id: int, data: ProjectUpdate) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    fields = data.model_dump(exclude_unset=True)
    for key, value in fields.items():
        setattr(project, key, value)
    project.updated_at = datetime.utcnow()
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def delete_project(session: Session, project_id: int) -> None:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    session.delete(project)
    session.commit()
