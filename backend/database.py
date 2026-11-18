"""
PersonaGuard Database Layer
===========================
Simple, lightweight SQLite database using SQLAlchemy.
Stores all profile, finding, scan, and remediation data locally.
"""

import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, sessionmaker

# Database file location: PersonaG/backend/personaguard.db
DB_FILE = Path(__file__).resolve().parent / "personaguard.db"
DATABASE_URL = f"sqlite:///{DB_FILE}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite in multi-threaded FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── Database Models ───────────────────────────────────────────────────

class UserProfile(Base):
    """Stores user identity details, handles, and consent status."""
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), default="Demo User")
    email = Column(String(120), default="demo.user@example.com")
    phone = Column(String(50), default="+91 90000 00000")
    handles_json = Column(Text, default='{"linkedin":"demo-user","github":"demo-user","instagram":"demo.user","x":"demo_user"}')
    consent_given = Column(Boolean, default=True)
    consent_date = Column(String(20), default="2026-08-19")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "fullName": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "handles": json.loads(self.handles_json or "{}"),
            "consentGiven": self.consent_given,
            "consentDate": self.consent_date,
        }


class Finding(Base):
    """Represents a discovered privacy vulnerability, leak, or match."""
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    source = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # Breach, Contact info, Personal details, Social profile, Image match
    severity = Column(String(20), nullable=False)  # Critical, High, Medium, Low
    date_found = Column(String(20), nullable=False)
    recommended_action = Column(Text, nullable=False)
    status = Column(String(20), default="Open")     # Open, Reviewing, Resolved
    confidence = Column(Integer, default=85)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "source": self.source,
            "category": self.category,
            "severity": self.severity,
            "dateFound": self.date_found,
            "recommendedAction": self.recommended_action,
            "status": self.status,
            "confidence": self.confidence,
        }


class RemediationAction(Base):
    """Actionable steps to resolve findings and reduce exposure score."""
    __tablename__ = "remediation_actions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    priority = Column(String(20), nullable=False)  # Critical, High, Medium, Low
    status = Column(String(20), default="Pending") # Pending, Completed
    impact = Column(Integer, default=3)            # Score reduction points
    finding_ids_json = Column(Text, default="[]")  # IDs of findings this resolves
    description = Column(Text, default="")
    steps_json = Column(Text, default="[]")
    template = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "priority": self.priority,
            "status": self.status,
            "impact": self.impact,
            "findingIds": json.loads(self.finding_ids_json or "[]"),
            "description": self.description,
            "steps": json.loads(self.steps_json or "[]"),
            "template": self.template,
        }


class ScanRecord(Base):
    """Log of all past and recent footprint / face-matching scans."""
    __tablename__ = "scan_records"

    id = Column(Integer, primary_key=True, index=True)
    scan_label = Column(String(50), nullable=False) # e.g. "Scan 1"
    date = Column(String(50), nullable=False)
    status = Column(String(20), default="Completed")# Completed, Failed, Running
    findings_count = Column(Integer, default=0)
    sources_count = Column(Integer, default=6)
    error_message = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.scan_label,
            "date": self.date,
            "status": self.status,
            "findings": self.findings_count,
            "sources": self.sources_count,
            "error": self.error_message,
        }


class Alert(Base):
    """System and vulnerability notifications."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), default="new-finding")
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    time = Column(String(50), nullable=False)
    read = Column(Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "time": self.time,
            "read": self.read,
        }


# ── Exposure Score Calculation Logic ─────────────────────────────────

def calculate_exposure_score(db) -> int:
    """
    Calculate the live Exposure Score (0-100, lower is safer).
    Formula:
      - Base points for unresolved findings (Critical: 8, High: 5, Medium: 3, Low: 1)
      - Minus impact points for completed remediation actions
      - Clamped between 10 and 95 for realistic security posture
    """
    unresolved_findings = db.query(Finding).filter(Finding.status != "Resolved").all()
    completed_actions = db.query(RemediationAction).filter(RemediationAction.status == "Completed").all()

    weight_map = {"Critical": 8, "High": 5, "Medium": 3, "Low": 1}
    raw_risk = sum(weight_map.get(f.severity, 2) for f in unresolved_findings)
    remediation_benefit = sum(a.impact for a in completed_actions)

    score = raw_risk - remediation_benefit
    # Clamp between 10 and 95
    return max(10, min(95, score))


# ── Database Initialization & Seeding ────────────────────────────────

def init_db():
    """Create all tables and seed initial demo data if database is empty."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed User Profile if not present
        if db.query(UserProfile).count() == 0:
            profile = UserProfile(
                full_name="Demo User",
                email="demo.user@example.com",
                phone="+91 90000 00000",
                handles_json=json.dumps({
                    "linkedin": "demo-user",
                    "github": "demo-user",
                    "instagram": "demo.user",
                    "x": "demo_user",
                }),
                consent_given=True,
                consent_date="2026-08-19",
            )
            db.add(profile)

        # 2. Seed Findings if not present
        if db.query(Finding).count() == 0:
            seed_rows = [
                ('E-mail found in a 2021 credential dump', 'Breach database', 'Breach', 'Critical', '2026-10-14', 'Change password and enable 2FA', 'Open'),
                ('Password hash in a simulated paste dump', 'Breach database', 'Breach', 'Critical', '2026-10-14', 'Change reused passwords; use a password manager', 'Open'),
                ('Phone and e-mail in a leaked marketing list', 'Breach database', 'Contact info', 'Critical', '2026-10-12', 'Change credentials and watch for phishing', 'Open'),
                ('Date of birth and home address in a directory listing', 'Public web search', 'Personal details', 'Critical', '2026-10-12', 'Send a removal request to the directory', 'Open'),
                ('Mobile number visible on public profile', 'LinkedIn (public)', 'Contact info', 'High', '2026-10-14', 'Hide contact info', 'Reviewing'),
                ('Commit history exposes personal e-mail', 'GitHub (public)', 'Contact info', 'High', '2026-10-13', 'Use the no-reply commit e-mail', 'Open'),
                ('Old forum profile lists phone number', 'Public web search', 'Contact info', 'High', '2026-10-13', 'Edit or delete the forum profile', 'Open'),
                ('Public résumé PDF shows home address', 'Public web search', 'Personal details', 'High', '2026-10-11', 'Remove the address from the résumé', 'Open'),
                ('Handle linked to full name on an old account', 'Public web search', 'Social profile', 'High', '2026-10-11', 'Review account visibility', 'Open'),
                ('Public friends list reveals family members', 'Public web search', 'Social profile', 'High', '2026-10-10', 'Set the friends list to private', 'Open'),
                ('Candidate image match on a public page (simulated)', 'Simulated demo dataset', 'Image match', 'High', '2026-10-10', 'Review the match, then confirm or reject it', 'Open'),
                ('Home city, school name and date of birth', 'Personal blog, 2019', 'Personal details', 'Medium', '2026-10-09', 'Request removal', 'Reviewing'),
                ('Bio shows city and workplace', 'LinkedIn (public)', 'Social profile', 'Medium', '2026-10-09', 'Shorten the public bio', 'Open'),
                ('Old Q&A profile uses real name', 'Public web search', 'Social profile', 'Medium', '2026-10-08', 'Deactivate the unused profile', 'Open'),
                ('Alumni directory lists graduation year', 'Public web search', 'Personal details', 'Medium', '2026-10-08', 'Ask the directory to hide it', 'Open'),
                ('Public comments reveal daily routine', 'Personal blog, 2019', 'Personal details', 'Medium', '2026-10-07', 'Remove or edit the comments', 'Open'),
                ('Event attendance list is public', 'Public web search', 'Social profile', 'Medium', '2026-10-07', 'Make attendance private', 'Open'),
                ('Public repos list a university e-mail', 'GitHub (public)', 'Contact info', 'Medium', '2026-10-06', 'Replace with a no-reply address', 'Open'),
                ('Profile photo reused across sites (simulated)', 'Simulated demo dataset', 'Image match', 'Medium', '2026-10-06', 'Use different photos per site', 'Open'),
                ('Old portfolio page shows age', 'Personal blog, 2019', 'Personal details', 'Medium', '2026-10-05', 'Remove the age line', 'Open'),
                ('Username reused on a gaming forum', 'Public web search', 'Social profile', 'Low', '2026-10-05', 'Use unique usernames', 'Open'),
                ('Public follower count and interests', 'LinkedIn (public)', 'Social profile', 'Low', '2026-10-04', 'Limit who can see connections', 'Open'),
                ('Old blog post mentions hobbies', 'Personal blog, 2019', 'Personal details', 'Low', '2026-10-04', 'Archive the post', 'Open'),
                ('Starred repositories reveal interests', 'GitHub (public)', 'Social profile', 'Low', '2026-10-03', 'Hide starred repositories', 'Open'),
                ('Search snippet shows full name', 'Public web search', 'Personal details', 'Low', '2026-10-03', 'No action needed; monitor', 'Open'),
                ('Outdated bio on inactive profile', 'LinkedIn (public)', 'Social profile', 'Low', '2026-10-02', 'Update or remove the bio', 'Open'),
                ('Username appears on a public tag page', 'Public web search', 'Social profile', 'Low', '2026-10-02', 'No action needed; monitor', 'Open'),
            ]
            for i, r in enumerate(seed_rows):
                f = Finding(
                    id=i + 1,
                    title=r[0],
                    source=r[1],
                    category=r[2],
                    severity=r[3],
                    date_found=r[4],
                    recommended_action=r[5],
                    status=r[6],
                    confidence=78 + ((i * 7) % 20),
                )
                db.add(f)

        # 3. Seed Remediation Actions if not present
        if db.query(RemediationAction).count() == 0:
            seed_actions = [
                {
                    "id": 1, "title": "Change breached passwords and enable 2FA", "priority": "Critical", "status": "Pending", "impact": 6, "findingIds": [1, 2, 3],
                    "description": "Passwords seen in breach data should be treated as compromised.",
                    "steps": ["Change the password on each affected account.", "Never reuse a password across sites.", "Turn on two-factor authentication where available."],
                    "template": None,
                },
                {
                    "id": 2, "title": "Remove personal details from directories and résumé", "priority": "High", "status": "Pending", "impact": 4, "findingIds": [4, 8, 15],
                    "description": "Home address and date of birth are used in identity fraud.",
                    "steps": ["Edit the résumé to show city only.", "Use the takedown template below for directory sites."],
                    "template": None,
                },
                {
                    "id": 3, "title": "Hide your phone number on public profiles", "priority": "High", "status": "Pending", "impact": 3, "findingIds": [5, 7],
                    "description": "Public phone numbers lead to spam, scams and SIM-swap attempts.",
                    "steps": ["Open profile privacy settings.", "Set contact info visibility to connections only or private."],
                    "template": None,
                },
                {
                    "id": 4, "title": "Review public profile visibility", "priority": "High", "status": "Pending", "impact": 3, "findingIds": [9, 10, 13, 14],
                    "description": "Limit what strangers can see on social and professional profiles.",
                    "steps": ["Switch friends and connections lists to private.", "Deactivate profiles you no longer use."],
                    "template": None,
                },
                {
                    "id": 5, "title": "Request removal of 2019 blog personal details", "priority": "Medium", "status": "Pending", "impact": 3, "findingIds": [12, 16, 20],
                    "description": "Old posts still show your city, school and date of birth.",
                    "steps": ["Edit or unpublish the posts.", "Ask the search engine to refresh the cached result."],
                    "template": None,
                },
                {
                    "id": 6, "title": "Use a no-reply e-mail for code commits", "priority": "Medium", "status": "Pending", "impact": 1, "findingIds": [6, 18],
                    "description": "Commit metadata exposes your personal e-mail address.",
                    "steps": ["Enable 'keep my e-mail private' in GitHub settings.", "Set the no-reply address in your git config."],
                    "template": None,
                },
                {
                    "id": 7, "title": "Prepare a takedown-request template", "priority": "Low", "status": "Pending", "impact": 2, "findingIds": [],
                    "description": "A ready-to-edit message you can send to a site owner. PersonaGuard does not send it for you.",
                    "steps": ["Copy the template.", "Fill in the page URL and your details.", "Send it yourself to the site contact."],
                    "template": "Subject: Request to remove my personal information\n\nHello,\n\nThe page at [URL] shows my personal information ([what is shown]). I am the person concerned and I do not consent to its publication. Please remove it within [30] days and confirm by reply.\n\nThank you,\n[Your name]",
                },
            ]
            for a in seed_actions:
                action = RemediationAction(
                    id=a["id"],
                    title=a["title"],
                    priority=a["priority"],
                    status=a["status"],
                    impact=a["impact"],
                    finding_ids_json=json.dumps(a["findingIds"]),
                    description=a["description"],
                    steps_json=json.dumps(a["steps"]),
                    template=a["template"],
                )
                db.add(action)

        # 4. Seed Scan History if not present
        if db.query(ScanRecord).count() == 0:
            seed_scans = [
                ("Scan 5", "2026-10-14 09:10", "Completed", 27, 6, None),
                ("Scan 4", "2026-09-30 09:05", "Completed", 25, 6, None),
                ("Scan 3b", "2026-09-23 09:00", "Failed", 0, 2, 'Simulated failure: "Breach database" timed out.'),
                ("Scan 3", "2026-09-16 09:02", "Completed", 22, 5, None),
                ("Scan 2", "2026-09-02 09:00", "Completed", 20, 5, None),
                ("Scan 1", "2026-08-19 09:00", "Completed", 18, 5, None),
            ]
            for s in seed_scans:
                sr = ScanRecord(
                    scan_label=s[0],
                    date=s[1],
                    status=s[2],
                    findings_count=s[3],
                    sources_count=s[4],
                    error_message=s[5],
                )
                db.add(sr)

        # 5. Seed Alerts if not present
        if db.query(Alert).count() == 0:
            seed_alerts = [
                (1, "high-severity", "High-severity finding", "Mobile number is visible on your public LinkedIn profile.", "2026-10-14 09:12", False),
                (2, "new-finding", "3 new findings", "The latest scan found 3 items not seen before.", "2026-10-14 09:10", False),
                (3, "scan-complete", "Scan completed", "Scan 5 processed 6 sources and found 27 items.", "2026-10-14 09:10", False),
                (4, "reminder", "Scheduled re-scan due", "Your next demonstration re-scan is due on 2026-10-28.", "2026-10-13 08:00", True),
                (5, "new-finding", "New breach notification (simulated)", "Your e-mail appears in a simulated 2021 credential dump.", "2026-10-01 10:30", True),
                (6, "scan-complete", "Scan completed", "Scan 4 processed 6 sources and found 25 items.", "2026-09-30 09:05", True),
            ]
            for a in seed_alerts:
                al = Alert(
                    id=a[0],
                    type=a[1],
                    title=a[2],
                    message=a[3],
                    time=a[4],
                    read=a[5],
                )
                db.add(al)

        db.commit()
    finally:
        db.close()


def get_db():
    """Dependency helper to yield database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
