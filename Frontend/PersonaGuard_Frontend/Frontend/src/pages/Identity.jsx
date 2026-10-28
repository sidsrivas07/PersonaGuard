import { useState } from 'react';
import { Upload, Trash2, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import DemoNotice from '../components/DemoNotice';

const HANDLES = [['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['instagram', 'Instagram'], ['x', 'X']];

export default function Identity() {
  const { profile, setProfile, referencePhoto, setReferencePhoto } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile); // edit a copy; only "Save" writes to the real profile
  const [saved, setSaved] = useState(false);

  const change = (field, value) => setDraft((d) => ({ ...d, [field]: value }));
  const changeHandle = (key, value) => setDraft((d) => ({ ...d, handles: { ...d.handles, [key]: value } }));

  const save = (e) => {
    e.preventDefault();
    setProfile(draft); setEditing(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // The photo stays in the browser. URL.createObjectURL makes a local preview, nothing is uploaded.
  const onPhoto = (e) => {
    const file = e.target.files[0];
    if (file) setReferencePhoto({ url: URL.createObjectURL(file), name: file.name });
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
          <h3>Reference photo (optional)</h3>
          <p className="muted small">Used only for the simulated image-match preview. It stays in this browser tab, is not uploaded and is not saved. It disappears when you refresh.</p>
          {referencePhoto ? (
            <div className="row gap">
              <img className="thumb" src={referencePhoto.url} alt="Your reference" />
              <div><div>{referencePhoto.name}</div>
                <button className="btn" onClick={() => setReferencePhoto(null)}><Trash2 size={14} />Remove photo</button></div>
            </div>
          ) : (
            <label className="btn upload"><Upload size={16} />Choose a photo of yourself<input type="file" accept="image/*" hidden onChange={onPhoto} /></label>
          )}
        </div>

        <div className="card stack">
          <h3>Consent status</h3>
          <p>{profile.consentGiven ? `Demo consent given on ${profile.consentDate}.` : 'Consent withdrawn. Scans are disabled.'}</p>
          <p className="muted small">Scans only run with consent, and only for the person who owns this profile. In this demo the consent is simulated and no record is stored on a server.</p>
          <button className="btn" onClick={toggleConsent}>{profile.consentGiven ? 'Withdraw consent' : 'Give consent'}</button>
        </div>
      </div>
    </div>
  );
}
