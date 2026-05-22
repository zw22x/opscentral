from sqlalchemy.orm import Session
from models.entities import Entity, Source, IngestionJob, EntityType
from datetime import datetime, timezone
import uuid

def get_or_create_source(db: Session, name: str, source_type: str, base_url: str, str = None): -> Source:
    source = db.query(Source).filter(Source.name == name).first()
    if not source:
        source = Source(
            name=name,
            source_type=source_type,
            base_url=base_url,
            config={}
        )
        db.add(source)
        db.commit()
        db.refresh(source)
    return source

def run_ingestion_job(db: Session, source_id: uuid.UUID, records: list[dict], entity_type: EntityType) -> IngestionJob:
    job = IngestionJob(
        source_id=source_id,
        status="running",
        started_at=datetime.now(timezone.utc)
    )
    db.add(job)
    db.commit()

    try:
        count = 0
        for record in records:
            entity = Entity(
                name=record["name"],
                entity_type=entity_type,
                desciption=record.get("description", ""),
                metadata_=record.get("metadata", {})
            )
            db.add(entity)
            count += 1

        db.commit()
        job.status = "completed"
        job.records_ingested = str(count)
        job.finished_at = datetime.now(timezone.utc)
    
    except Exception as e:
        db.rollback()
        job.status = "failed"
        job.error_message = str(e)
        job.finished_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(job)
    return job
    