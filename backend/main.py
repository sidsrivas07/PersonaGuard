"""
PersonaGuard Backend API Service
================================
FastAPI backend providing persistent database management, dynamic
exposure scoring, and deep learning face-matching.
"""

import json
import os
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import (
    Alert,
    Finding,
    RemediationAction,
    ScanRecord,
    SessionLocal,
    UserProfile,
    calculate_exposure_score,
    get_db,
    init_db,
)
from face_matching import FaceMatchConfig, FaceMatchPipeline
from face_matching.face_detector import FaceDetector

app = FastAPI(
    title="PersonaGuard Full API",
    description="Privacy-focused identity exposure audit and face-matching backend.",
    version="2.0.0",
)

# CORS setup for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory configurations
BASE_DIR = Path(__file__).resolve().parent.parent
CANDIDATES_DIR = BASE_DIR / "tests" / "test_images" / "candidates"
REFERENCE_DIR = BASE_DIR / "tests" / "test_images" / "reference"
TEMP_UPLOAD_DIR = BASE_DIR / "temp_uploads"
TEMP_UPLOAD_DIR.mkdir(exist_ok=True)

# Shared InsightFace Computer Vision models
cv_config = FaceMatchConfig(similarity_threshold=0.45)
pipeline = FaceMatchPipeline(cv_config)
detector = FaceDetector(cv_config)


@app.on_event("startup")
def on_startup():
    """Ensure database tables exist and baseline demo data is seeded."""
    init_db()


# ── Pydantic Request Models ──────────────────────────────────────────

class ProfileUpdate(BaseModel):
    fullName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    handles: Optional[Dict[str, str]] = None
    consentGiven: Optional[bool] = None
    consentDate: Optional[str] = None


class FindingStatusUpdate(BaseModel):
    status: str  # "Open", "Reviewing", "Resolved"


class ScanRunRequest(BaseModel):
    simulateFailure: Optional[bool] = False


# ── Dashboard & Metrics Endpoints ────────────────────────────────────

@app.get("/api/dashboard")
def get_dashboard_data(db: Session = Depends(get_db)):
    """
    Returns aggregated metrics, dynamic exposure score,
    severity distributions, and recent findings.
    """
    findings = db.query(Finding).all()
    actions = db.query(RemediationAction).all()
    score = calculate_exposure_score(db)

    # Count by severity
    critical_count = sum(1 for f in findings if f.severity == "Critical")
    high_count = sum(1 for f in findings if f.severity == "High")
    medium_count = sum(1 for f in findings if f.severity == "Medium")
    low_count = sum(1 for f in findings if f.severity == "Low")

    # Count by status
    open_count = sum(1 for f in findings if f.status == "Open")
    reviewing_count = sum(1 for f in findings if f.status == "Reviewing")
    resolved_count = sum(1 for f in findings if f.status == "Resolved")

    # Dynamic trend history: past scans + current live score
    trend_history = [
        {"label": "Scan 1", "score": 86},
        {"label": "Scan 2", "score": 81},
        {"label": "Scan 3", "score": 74},
        {"label": "Scan 4", "score": 70},
        {"label": "Live Now", "score": score},
    ]

    recent_findings = [f.to_dict() for f in findings[:6]]

    return {
        "exposureScore": score,
        "totalFindings": len(findings),
        "severityCounts": {
            "critical": critical_count,
            "high": high_count,
            "medium": medium_count,
            "low": low_count,
        },
        "statusCounts": {
            "open": open_count,
            "reviewing": reviewing_count,
            "resolved": resolved_count,
        },
        "completedActions": sum(1 for a in actions if a.status == "Completed"),
        "totalActions": len(actions),
        "trendHistory": trend_history,
        "recentFindings": recent_findings,
    }


# ── User Profile & Consent Endpoints ─────────────────────────────────

@app.get("/api/profile")
def get_profile(db: Session = Depends(get_db)):
    """Retrieve the user's active identity profile."""
    profile = db.query(UserProfile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return profile.to_dict()


@app.put("/api/profile")
def update_profile(update_data: ProfileUpdate, db: Session = Depends(get_db)):
    """Update profile identity details and consent records."""
    profile = db.query(UserProfile).first()
    if not profile:
        profile = UserProfile()
        db.add(profile)

    if update_data.fullName is not None:
        profile.full_name = update_data.fullName
    if update_data.email is not None:
        profile.email = update_data.email
    if update_data.phone is not None:
        profile.phone = update_data.phone
    if update_data.handles is not None:
        profile.handles_json = json.dumps(update_data.handles)
    if update_data.consentGiven is not None:
        profile.consent_given = update_data.consentGiven
    if update_data.consentDate is not None:
        profile.consent_date = update_data.consentDate

    db.commit()
    db.refresh(profile)
    return profile.to_dict()


# ── Findings Endpoints ───────────────────────────────────────────────

@app.get("/api/findings")
def list_findings(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all findings with optional filtering."""
    query = db.query(Finding)
    if status and status != "All":
        query = query.filter(Finding.status == status)
    if severity and severity != "All":
        query = query.filter(Finding.severity == severity)
    if category and category != "All":
        query = query.filter(Finding.category == category)

    findings = query.all()
    return [f.to_dict() for f in findings]


@app.patch("/api/findings/{finding_id}")
def update_finding_status(
    finding_id: int,
    payload: FindingStatusUpdate,
    db: Session = Depends(get_db),
):
    """Update the resolution status of an individual finding."""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")

    finding.status = payload.status
    db.commit()
    db.refresh(finding)

    # Return updated finding along with recalculated exposure score
    new_score = calculate_exposure_score(db)
    return {
        "finding": finding.to_dict(),
        "exposureScore": new_score,
    }


# ── Remediation Endpoints ────────────────────────────────────────────

@app.get("/api/remediation")
def list_remediation_actions(db: Session = Depends(get_db)):
    """Fetch all remediation tasks and their score impact."""
    actions = db.query(RemediationAction).all()
    return [a.to_dict() for a in actions]


@app.post("/api/remediation/{action_id}/toggle")
def toggle_remediation_action(action_id: int, db: Session = Depends(get_db)):
    """
    Toggle a remediation task between Pending and Completed.
    Automatically resolves linked findings when marked Completed.
    """
    action = db.query(RemediationAction).filter(RemediationAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found.")

    new_status = "Completed" if action.status == "Pending" else "Pending"
    action.status = new_status

    # Update associated findings
    linked_ids = json.loads(action.finding_ids_json or "[]")
    if linked_ids:
        for fid in linked_ids:
            finding = db.query(Finding).filter(Finding.id == fid).first()
            if finding:
                finding.status = "Resolved" if new_status == "Completed" else "Open"

    db.commit()
    db.refresh(action)

    new_score = calculate_exposure_score(db)
    return {
        "action": action.to_dict(),
        "exposureScore": new_score,
    }


# ── Scan Management Endpoints ────────────────────────────────────────

@app.get("/api/scans")
def list_scans(db: Session = Depends(get_db)):
    """Fetch chronological history of audit scans."""
    scans = db.query(ScanRecord).order_by(ScanRecord.id.desc()).all()
    return [s.to_dict() for s in scans]


@app.post("/api/scans/run")
def run_scan(request: ScanRunRequest, db: Session = Depends(get_db)):
    """
    Record and execute an audit scan across sources.
    """
    scan_number = db.query(ScanRecord).count() + 1
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    if request.simulateFailure:
        record = ScanRecord(
            scan_label=f"Scan {scan_number}b",
            date=now_str,
            status="Failed",
            findings_count=0,
            sources_count=3,
            error_message='Simulated failure: "Breach database" timed out. Nothing was changed.',
        )
    else:
        total_findings = db.query(Finding).count()
        record = ScanRecord(
            scan_label=f"Scan {scan_number}",
            date=now_str,
            status="Completed",
            findings_count=total_findings,
            sources_count=6,
            error_message=None,
        )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record.to_dict()


# ── Alerts Endpoints ─────────────────────────────────────────────────

@app.get("/api/alerts")
def list_alerts(db: Session = Depends(get_db)):
    """Fetch notifications and security alerts."""
    alerts = db.query(Alert).order_by(Alert.id.desc()).all()
    return [a.to_dict() for a in alerts]


@app.patch("/api/alerts/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as read."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.read = True
    db.commit()
    return alert.to_dict()


# ── Face Matching & Computer Vision Endpoints ────────────────────────

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "PersonaGuard Face Matching API",
        "model": cv_config.model_name,
        "similarity_threshold": cv_config.similarity_threshold,
    }


@app.post("/api/detect-face")
async def detect_face(file: UploadFile = File(...)):
    """
    Validate and detect faces in an uploaded reference portrait.
    Returns relative bounding box and confidence score.
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file or format.")

        faces = detector.detect_faces(img)

        if not faces:
            return {
                "success": True,
                "face_detected": False,
                "num_faces": 0,
                "message": "No face detected in the image. Please upload a clear portrait.",
            }

        primary_face = faces[0]
        h, w = img.shape[:2]

        bbox = primary_face.bbox
        x1, y1, x2, y2 = bbox
        rel_box = {
            "x": round((x1 / w) * 100, 2),
            "y": round((y1 / h) * 100, 2),
            "width": round(((x2 - x1) / w) * 100, 2),
            "height": round(((y2 - y1) / h) * 100, 2),
        }

        # Cache reference image locally for active session
        saved_ref_path = TEMP_UPLOAD_DIR / "current_reference.png"
        with open(saved_ref_path, "wb") as f:
            f.write(contents)

        return {
            "success": True,
            "face_detected": True,
            "num_faces": len(faces),
            "confidence": round(float(primary_face.detection_confidence), 4),
            "bbox": [round(float(v), 1) for v in bbox],
            "relative_bbox": rel_box,
            "image_dimensions": {"width": w, "height": h},
            "message": f"Successfully detected {len(faces)} face(s). Primary face confidence: {round(primary_face.detection_confidence * 100, 1)}%",
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)},
        )


@app.get("/api/candidates")
def list_candidates():
    """List all candidate images available in the candidate pool."""
    candidates = []
    if CANDIDATES_DIR.exists():
        for idx, img_file in enumerate(sorted(CANDIDATES_DIR.iterdir()), 1):
            if img_file.is_file() and not img_file.name.startswith("."):
                candidates.append({
                    "id": idx,
                    "filename": img_file.name,
                    "source": "Web Scan Discovery (Public media index)",
                    "url": f"/api/candidates/image/{img_file.name}",
                })
    return candidates


@app.get("/api/candidates/image/{filename}")
def get_candidate_image(filename: str):
    """Serve a candidate image file for UI previews."""
    file_path = CANDIDATES_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Candidate image not found.")
    return FileResponse(file_path)


@app.post("/api/match-face")
async def match_face(
    reference: Optional[UploadFile] = File(None),
    threshold: Optional[float] = Form(0.45),
    db: Session = Depends(get_db),
):
    """
    Compare the reference face against all candidate images using ArcFace.
    """
    temp_ref_path = None
    try:
        if reference is not None:
            temp_ref = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
            content = await reference.read()
            temp_ref.write(content)
            temp_ref.close()
            temp_ref_path = temp_ref.name
        else:
            cached_ref = TEMP_UPLOAD_DIR / "current_reference.png"
            default_ref = REFERENCE_DIR / "rdj_reference.png"
            if cached_ref.exists():
                temp_ref_path = str(cached_ref)
            elif default_ref.exists():
                temp_ref_path = str(default_ref)
            else:
                raise HTTPException(
                    status_code=400,
                    detail="No reference image provided and no cached reference found.",
                )

        candidate_paths = [
            str(f)
            for f in sorted(CANDIDATES_DIR.iterdir())
            if f.is_file() and not f.name.startswith(".")
        ]

        if not candidate_paths:
            return {
                "success": True,
                "total_candidates": 0,
                "positive_matches": 0,
                "matches": [],
                "message": "No candidate images found in candidate pool.",
            }

        # Run pipeline with requested threshold
        active_threshold = threshold if threshold is not None else cv_config.similarity_threshold
        run_config = FaceMatchConfig(similarity_threshold=active_threshold)
        run_pipeline = FaceMatchPipeline(run_config)
        result = run_pipeline.match_against_candidates(temp_ref_path, candidate_paths)

        matches_output = []
        for idx, match in enumerate(result.matches, 1):
            filename = Path(match.candidate_image_path).name
            sim_score = match.similarity_score if match.similarity_score is not None else 0.0
            sim_pct = round(max(0.0, sim_score) * 100, 1)

            matches_output.append({
                "id": idx,
                "filename": filename,
                "source": "Web Scan Discovery (Public media)",
                "image_url": f"/api/candidates/image/{filename}",
                "num_faces_detected": match.num_faces_detected,
                "similarity": sim_pct,
                "similarity_score": round(sim_score, 4),
                "is_match": match.is_match,
                "face_bbox": match.face_bbox,
                "assessment": (
                    "Likely match — possible image reuse found"
                    if match.is_match
                    else "Low similarity — not matching reference"
                ),
            })

        return {
            "success": True,
            "reference_faces": result.reference_faces_detected,
            "threshold_used": result.config_summary.get("similarity_threshold", active_threshold),
            "total_candidates": len(result.matches),
            "positive_matches": len(result.get_positive_matches()),
            "matches": matches_output,
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)},
        )
    finally:
        if reference is not None and temp_ref_path and os.path.exists(temp_ref_path):
            try:
                os.remove(temp_ref_path)
            except OSError:
                pass
