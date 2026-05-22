from fastapi import FastAPI, Depends
from sqlmodel import SQLModel, create_engine, Session
from pydantic import BaseModel
import boto3

app = FastAPI()

# db setup
engine = create_engine("postgresql://user:password@localhost.5432/metadata")

class IngestionJob(BaseModel):
    source_type: str # postgres, api
    source_config: dict 
    destination_table: str

@app.post("/ingest")
def trigger_ingest(job: IngestionJob, db: Session = Depends(...)):
    # trigger perfect flow or run async
    # for now call function
    run_ingestion_flow(job)
    return {"status": "started", "job_id": "uuid"}
