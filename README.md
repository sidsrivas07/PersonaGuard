# PersonaGuard

> **Ethical, Consent-Based Personal Digital Footprint Auditing Platform with Face-Matching Capabilities**

PersonaGuard enables users to discover, audit, and remediate exposed personal data and biometric image appearances across public web sources with strict consent boundaries.

---

## 🏛️ Architecture Overview

The system consists of three integrated layers:

```
┌────────────────────────────────────────────────────────┐
│                   React + Vite UI                      │
│   (Dashboard, Identity Audit, InsightFace Scans,       │
│    Remediation Workflow, Alerts, Settings)             │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST (/api/*)
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Backend Server                │
│   (SQLite ORM, Findings DB, Real-time Score Engine,    │
│    Photo Upload Validation, Match Orchestration)       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│           InsightFace Face-Matching Engine             │
│   • Detection: RetinaFace (det_size 640x640)           │
│   • Embedding: ArcFace w600k_r50 (512-D L2 normalized) │
│   • Matcher: Cosine similarity with confidence scores  │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.9+**
- **Node.js 18+ & npm**

### 2. Backend & Face-Matching Setup

```bash
# Clone the repository
git clone https://github.com/sidsrivas07/personaguard.git
cd personaguard

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies (FastAPI, InsightFace, ONNX Runtime, OpenCV, PyTorch)
pip install -r requirements.txt

# Start the FastAPI backend server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
> **Note**: On the first run, InsightFace automatically downloads the pre-trained `buffalo_l` model weights (~300MB) from the official InsightFace model repository to `~/.insightface/models/buffalo_l/`.

### 3. Frontend Setup

In a new terminal window:

```bash
cd Frontend

# Install frontend dependencies
npm install

# Start the Vite development server (proxies /api to localhost:8000)
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Running Face Matching Standalone

You can test the face-matching pipeline directly via CLI:

```bash
# Compare a reference portrait against candidate images
python demo.py -r tests/test_images/reference/rdj_reference.png -c tests/test_images/candidates/

# Run tests
pytest tests/ -v
```

---

## 📂 Project Structure

```
PersonaGuard/
├── backend/                  # FastAPI REST API & SQLite Database
│   ├── main.py               # API endpoints (dashboard, findings, face-matching)
│   └── database.py           # SQLAlchemy models & score calculation
├── face_matching/            # Core Computer Vision Pipeline
│   ├── face_detector.py      # RetinaFace face detection
│   ├── embedding_extractor.py# ArcFace 512-D feature vector extraction
│   ├── face_matcher.py       # Cosine similarity matching engine
│   ├── pipeline.py           # End-to-end matching orchestrator
│   └── config.py             # Model & threshold configuration
├── Frontend/                 # React 18 + Vite SPA
│   ├── src/
│   │   ├── context/AppContext.jsx   # Live backend sync + offline state
│   │   ├── pages/                   # Dashboard, Identity, Scans, etc.
│   │   ├── components/              # Charts, Gauges, Tables, Cards
│   │   └── services/scanService.js  # API client
│   └── vite.config.js               # Dev server & backend proxy
├── tests/                    # Unit tests & test images
│   └── test_images/          # Sample reference & candidate images
├── demo.py                   # CLI demonstration tool
└── requirements.txt          # Python dependencies
```

---

## 🔒 Privacy & Ethical Consent

PersonaGuard adheres to strict ethical privacy principles:
- **Reference photos are ephemeral**: Never permanently stored without user confirmation.
- **Explainable similarity**: Matches report numerical cosine distance and visual bounding boxes rather than absolute verdicts.
- **Local computation**: Detection and embedding extraction run locally without third-party cloud biometric APIs.
