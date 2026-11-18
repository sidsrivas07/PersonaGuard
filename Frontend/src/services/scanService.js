// SERVICE LAYER: the only file that "talks" to a scanner.
// Right now it SIMULATES a scan with timers. No internet request is made.
//
// FUTURE BACKEND INTEGRATION (replace the function bodies, keep the same inputs/outputs so the UI needs no change):
//   startScan(profile, options)  -> later: send the profile + consent to your backend, then receive progress/results.
//   getSimulatedImageMatches()   -> later: return real results from the face-matching module via the backend.
// Endpoint names are NOT defined yet; decide them together with your backend when it exists.

import { SOURCES, initialFindings, imageMatches } from '../data/mockData';

const STEP_MS = 900; // time per simulated source

/**
 * Simulated scan. Calls onProgress(percent, sourceName) after each source,
 * then resolves with a scan summary. Rejects if simulateFailure is true.
 */
export function startScan(profile, { simulateFailure = false, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    let done = 0;
    const timer = setInterval(() => {
      if (simulateFailure && done === 3) {
        clearInterval(timer);
        const err = new Error('Simulated failure: "Breach database" timed out. Nothing was changed.');
        err.sourcesProcessed = done;
        reject(err);
        return;
      }
      if (done >= SOURCES.length) {
        clearInterval(timer);
        resolve({
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          status: 'Completed',
          findings: initialFindings.length, // demo: always the same sample findings
          sources: SOURCES.length,
        });
        return;
      }
      done += 1;
      onProgress?.(Math.round((done / SOURCES.length) * 100), SOURCES[done - 1]);
    }, STEP_MS);
  });
}

export function getSimulatedImageMatches() {
  return imageMatches;
}

/**
 * Validate a reference photo with the Python face-matching module.
 */
export async function detectFace(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/detect-face', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Face detection failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Perform real face-matching against candidate images via FastAPI + InsightFace.
 * Falls back gracefully to simulation if backend is unavailable.
 */
export async function fetchImageMatches({ threshold = 0.45, referenceFile = null } = {}) {
  try {
    const formData = new FormData();
    formData.append('threshold', String(threshold));
    if (referenceFile) {
      formData.append('reference', referenceFile);
    }

    const response = await fetch('/api/match-face', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Match API error ${response.status}`);
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.matches)) {
      return {
        isLive: true,
        threshold: data.threshold_used,
        totalCandidates: data.total_candidates,
        positiveMatches: data.positive_matches,
        matches: data.matches,
      };
    }
  } catch (err) {
    console.warn('Real face matching service unavailable, falling back to simulated data:', err);
  }

  return {
    isLive: false,
    threshold,
    totalCandidates: imageMatches.length,
    positiveMatches: imageMatches.filter((m) => m.similarity >= 70).length,
    matches: imageMatches.map((m) => ({
      ...m,
      filename: m.reference,
      image_url: null,
      is_match: m.similarity >= 70,
      assessment: m.similarity >= 70 ? 'Likely match — possible image reuse found' : 'Low similarity — not matching reference',
    })),
  };
}
