import { useState } from 'react';
import { Upload, Trash2, Pencil, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { detectFace } from '../services/scanService';
import DemoNotice from '../components/DemoNotice';

const HANDLES = [['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['instagram', 'Instagram'], ['x', 'X']];

export default function Identity() {
  const { profile, setProfile, referencePhoto, setReferencePhoto } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile); // edit a copy; only "Save" writes to the real profile
  const [saved, setSaved] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState(null);

  const change = (field, value) => setDraft((d) => ({ ...d, [field]: value }));
  const changeHandle = (key, value) => setDraft((d) => ({ ...d, handles: { ...d.handles, [key]: value } }));

  const save = (e) => {
    e.preventDefault();
    setProfile(draft); setEditing(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Run real face detection with the InsightFace AI backend
  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDetecting(true);
    setDetectionError(null);
    const localUrl = URL.createObjectURL(file);

    try {
      const result = await detectFace(file);
      setReferencePhoto({
        url: localUrl,
        name: file.name,
        file: file,
        detection: result,
      });
    } catch (err) {
      console.warn('Face detection call failed, keeping local preview:', err);
      setDetectionError('AI backend unreachable or error during detection. Using local preview.');
      setReferencePhoto({
        url: localUrl,
        name: file.name,
        file: file,
        detection: null,
      });
    } finally {
      setDetecting(false);
    }
  };

  // Quick action: load the bundled reference photo from test_images
  const loadDemoPhoto = async () => {
    setDetecting(true);
    setDetectionError(null);
    try {
      const res = await fetch('/api/detect-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      // Or fetch from candidates endpoint
      const imgRes = await fetch('/tests/test_images/reference/rdj_reference.png');
      if (imgRes.ok) {
        const blob = await imgRes.blob();
        const file = new File([blob], 'rdj_reference.png', { type: 'image/png' });
        const localUrl = URL.createObjectURL(file);
        const detectRes = await detectFace(file);
        setReferencePhoto({
          url: localUrl,
          name: 'rdj_reference.png (Demo Portrait)',
          file: file,
          detection: detectRes,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetecting(false);
    }
  };

  const toggleConsent = () => {
    const consentGiven = !profile.consentGiven;
    setProfile({ ...profile, consentGiven, consentDate: consentGiven ? new Date().toISOString().slice(0, 10) : profile.consentDate });
  };

  return (
    <div className="stack">
      <DemoNotice>This is a demonstration profile stored only in your browser. Use your own details only. PersonaGuard is for self-audit, never for looking up other people.</DemoNotice>
      {saved && <div className="notice success">Profile saved in this browser.</div>}

      <form className="card stack" onSubmit={save}>
        <div className="row between">
          <h3>Identity details</h3>
          {!editing
            ? <button type="button" className="btn" onClick={() => { setDraft(profile); setEditing(true); }}><Pencil size={14} />Edit</button>
            : <div className="row gap"><button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button><button className="btn primary">Save changes</button></div>}
        </div>
        <div className="grid-2">
          <label className="field"><span>Full name</span><input disabled={!editing} required value={editing ? draft.fullName : profile.fullName} onChange={(e) => change('fullName', e.target.value)} /></label>
          <label className="field"><span>Email</span><input type="email" disabled={!editing} required value={editing ? draft.email : profile.email} onChange={(e) => change('email', e.target.value)} /></label>
          <label className="field"><span>Phone number</span><input disabled={!editing} value={editing ? draft.phone : profile.phone} onChange={(e) => change('phone', e.target.value)} /></label>
        </div>
        <h4>Social-media handles</h4>
        <div className="grid-2">
          {HANDLES.map(([key, label]) => (
            <label className="field" key={key}><span>{label}</span>
              <input disabled={!editing} value={editing ? draft.handles[key] : profile.handles[key]} onChange={(e) => changeHandle(key, e.target.value)} />
            </label>
          ))}
        </div>
      </form>

      <div className="grid-2">
        <div className="card stack">
          <div className="row between">
            <h3>Reference photo (Face-Matching)</h3>
            <span className="pill">InsightFace ArcFace</span>
          </div>
          <p className="muted small">
            Processed with InsightFace on Apple Silicon CPU. Used exclusively to detect matching faces during scans. Raw facial embeddings are never permanently stored.
          </p>

          {detecting && (
            <div className="notice warn">
              <Loader2 size={16} className="spin" /> Analyzing facial geometry & landmarks…
            </div>
          )}

          {detectionError && (
            <div className="notice warn">
              <AlertCircle size={16} /> {detectionError}
            </div>
          )}

          {referencePhoto ? (
            <div className="stack">
              <div className="row gap" style={{ alignItems: 'flex-start' }}>
                <div className="face-preview-container">
                  <img
                    className="thumb"
                    style={{ width: '110px', height: '110px' }}
                    src={referencePhoto.url}
                    alt="Your reference"
                  />
                  {referencePhoto.detection?.relative_bbox && (
                    <div
                      className="face-bbox"
                      style={{
                        left: `${referencePhoto.detection.relative_bbox.x}%`,
                        top: `${referencePhoto.detection.relative_bbox.y}%`,
                        width: `${referencePhoto.detection.relative_bbox.width}%`,
                        height: `${referencePhoto.detection.relative_bbox.height}%`,
                      }}
                      title="Detected face bounding box"
                    />
                  )}
                </div>
                <div className="stack" style={{ gap: '6px' }}>
                  <div style={{ fontWeight: 600 }}>{referencePhoto.name}</div>
                  {referencePhoto.detection?.face_detected ? (
                    <div className="row gap" style={{ color: 'var(--success)', fontSize: '13px' }}>
                      <CheckCircle2 size={15} />
                      <span>
                        Verified: {Math.round(referencePhoto.detection.confidence * 100)}% detection confidence
                      </span>
                    </div>
                  ) : referencePhoto.detection ? (
                    <div className="row gap" style={{ color: 'var(--critical)', fontSize: '13px' }}>
                      <AlertCircle size={15} />
                      <span>No face detected in this photo</span>
                    </div>
                  ) : null}
                  <button className="btn small" onClick={() => setReferencePhoto(null)}>
                    <Trash2 size={14} /> Remove photo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="row gap wrap">
              <label className="btn upload primary">
                <Upload size={16} /> Choose portrait photo
                <input type="file" accept="image/*" hidden onChange={onPhoto} />
              </label>
              <button type="button" className="btn" onClick={loadDemoPhoto} disabled={detecting}>
                <Sparkles size={15} /> Load Demo Portrait
              </button>
            </div>
          )}
        </div>

        <div className="card stack">
          <h3>Consent status</h3>
          <p>{profile.consentGiven ? `Consent recorded on ${profile.consentDate}.` : 'Consent withdrawn. Scans are disabled.'}</p>
          <p className="muted small">Scans only run with consent, and only for the person who owns this profile. In this demo the consent is simulated and no record is stored on a server.</p>
          <button className="btn" onClick={toggleConsent}>{profile.consentGiven ? 'Withdraw consent' : 'Give consent'}</button>
        </div>
      </div>
    </div>
  );
}
