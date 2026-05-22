from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
import enum
from .base import Base

# classes for types of entities
class EntityType(str, enum.Enum):
    company = "company"
    person = "person"
    vessel = "vessel"
    ip_address = "ip_address"
    aircraft = "aircraft"

class AlertSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class Entity(Base):
    __tablename__ = "entities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid64)
    name = Column(String(255), nullable=False)
    entity_type = Column(Enum(EntityType), nullable=False)
    description = Column(Text)
    metadata = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    alerts = relationship("Alert", back_populates="entity", cascade="all, delete-orphan")
    source_links = relationship("EntitySource", back_populates="entity")
    relationships_from = relationship("EntityRelationship", foreign_keys="EntityRelationship.from_entity_id", back_populates="from_entity")
    relationships_to = relationship("EntityRelationship", foreign_keys="EntityRelationship.to_entity_id", back_populates="to_entity")

class Source(Base):
    __tablename__ = "sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    source_type = Column(String(50))
    base_url = Column(String(255))
    last_ingested_at = Column(DateTime(timezone=True))
    config = Column(JSON, default=dict)

    ingestion_jobs = relationship("IngestionJob", back_populates="source")
    entity_links = relationship("EntitySource", back_populates="source")

class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id"))
    status = Column(String(20), default="pending")
    records_ingested = Column(String(10), default="0")
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    finished_at = Column(DateTime(timezone=True))

    source = relationship("Source", back_populates="ingestion_jobs")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    resolved = Column(String(5), default="false")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    entity = relationship("Entity", back_populates="alerts")

class EntityRelationship(Base):
    __tablename__ = "entity_relationships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False)
    to_entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False)
    relationship_type = Column(String(100), nullable=False)
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    from_entity = relationship("Entity", foreign_keys=[from_entity_id], back_populates="relationships_from")
    to_entity = relationship("Entity", foreign_keys=[to_entity_id], back_populates="relationships_to")

class EntitySource(Base):
    __tablename__ = "entity_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id"), nullable=False)
    external_id = Column(String(255))
    raw_data = Column(JSON, default=dict)
    ingested_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    entity = relationship("Entity", back_populates="source_links")
    source = relationship("Source", back_populates="entity_links")
    
