from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from models.base import get_db
from models.entities import Entity, Source, IngestionJob, EntityType, Alert, EntityRelationship, AlertSeverity
from pipelines.ingest import get_or_create_source, run_ingestion_job

app = FastAPI(title="OpsCentral API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://opscentral.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# pydantic schemas

class IngestRequest(BaseModel):
    source_name: str
    source_type: str
    entity_type: str
    records: list[dict]

class AlertCreate(BaseModel):
    entity_id: str
    severity: str
    title: str
    description: Optional[str] = None


# health check 
@app.get("/health")
def health_check():
    return {"status": "connected"}

# entities

@app.get("/entities")
def list_entities(
    skip: int = 0,
    limit: int = 50,
    entity_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Entity)
    if entity_type:
        query = query.filter(Entity.entity_type == entity_type)
    if search:
        query = query.filter(Entity.name.ilike(f"%{search}%"))
    total = query.count()
    entities = query.offset(skip).limit(limit).all()
    return {
        "total": total,
        "entities": [
            {
                "id": str(e.id),
                "name": e.name,
                "entity_type": e.entity_type,
                "description": e.description,
                "meta": e.metadata_,
                "created_at": e.created_at.isoformat(),
            }
            for e in entities
        ]
    }

@app.get("/entities/{entity_id}")
def get_entity(entity_id: str, db: Session = Depends(get_db)):
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    alerts = [
        {
            "id": str(a.id),
            "severity": a.severity,
            "title": a.title,
            "description": a.description,
            "resolved": a.resolved,
            "created_at": a.created_at.isoformat()
        }
        for a in entity.alerts
    ]
    return {
        "id": str(entity.id),
        "name": entity.name,
        "entity_type": entity.entity_type,
        "description": entity.description,
        "meta": entity.metadata_,
        "created_at": entity.created_at.isoformat(),
        "alerts": alerts
    }

# alerts

@app.post("/alerts")
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    entity = db.query(Entity).filter(Entity.id == payload.entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    alert = Alert(
        entity_id=payload.entity_id,
        severity=payload.severity,
        title=payload.title,
        description=payload.description
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {"id": str(alert.id), "status": "created"}

# ingestion

@app.post("/ingest")
def ingest_data(payload: IngestRequest, db: Session = Depends(get_db)):
    try:
        entity_type = EntityType(payload.entity_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid entity_type: {payload.entity_type}")
    
    source = get_or_create_source(db, payload.source_name, payload.source_type)
    job = run_ingestion_job(db, source.id, payload.records, entity_type)
    return {
        "job_id": str(job.id),
        "status": job.status,
        "records_ingested": job.records_ingested,
    }

@app.get("/jobs")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(IngestionJob).order_by(IngestionJob.started_at.desc()).limit(20).all()
    return [
        {
            "id": str(j.id),
            "status": j.status,
            "records_ingested": j.records_ingested,
            "started_at": j.started_at.isoformat(),
            "finished_at": j.finished_at.isoformat() if j.finished_at else None
        }
        for j in jobs
    ]

# sources

@app.get("/sources")
def list_sources(db: Session = Depends(get_db)):
    sources = db.query(Source).all()
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "source_type": s.source_type,
            "base_url": s.base_url,
            "last_ingested_at": s.last_ingested_at.isoformat() if s.last_ingested_at else None
        }
        for s in sources
    ]
    
