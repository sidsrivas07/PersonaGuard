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
