# PersonaGuard Frontend (demonstration)

React + Vite + JavaScript dashboard for PersonaGuard. **All data is simulated.** No backend, no real scanning, no real face matching.

## Run it
```bash
cd PersonaGuard/Frontend
npm install
npm run dev        # open the address it prints (usually http://localhost:5173)
npm run build      # production build check
```
Requires Node.js 18+.

## Files to understand first
1. `src/data/mockData.js` - every piece of sample data.
2. `src/context/AppContext.jsx` - shared state + actions (scan, remediation, alerts, reset).
3. `src/services/scanService.js` - the simulated scan (the future backend hook).
4. `src/App.jsx` - navigation.
5. `src/pages/*.jsx` - one file per screen; `src/components/*.jsx` - reusable pieces.

## How it works
- **Navigation:** `page` (a string) lives in context. `App.jsx` maps it to a page component. No router library.
- **Data flow:** `mockData.js` -> `AppContext` (state, saved to localStorage) -> pages read with `useApp()`.
- **Consistency:** score, severity counts and statuses are *derived* in the context, so completing a remediation action updates Dashboard, Findings and Reports together.
- **Simulated scan:** `runScan()` in the context calls `startScan()` in `scanService.js`, which uses a timer per source and reports progress. The "make it fail" checkbox demonstrates the Failed state.
- **Reports:** "Download PDF report" uses the browser print dialog (choose Save as PDF). A print stylesheet hides the menu.
- **Reference photo:** kept in memory only (never uploaded or saved).

## Future backend integration points
| Where | What to replace |
|---|---|
| `scanService.js` `startScan()` | Send profile/consent to your backend; return scan progress/results |
| `scanService.js` `getSimulatedImageMatches()` | Return real results from the face-matching module through the backend |
| `AppContext.jsx` initial state | Load findings, scans, alerts, remediation from the backend instead of `mockData.js` |
| `AppContext.jsx` actions | Save status changes/consent via the backend |

No API endpoints are defined yet.

## Connecting the face-matching module later
The Scans page has a simulated "Image matching preview" (candidate image, source, similarity, review status) and My Identity has the reference-photo input. When the Python module is exposed through a backend, make `getSimulatedImageMatches()` fetch its results in the same shape: `{ id, source, reference, similarity }`. Keep match similarity separate from the exposure score.

## Simulated vs real
Simulated: all findings, scans, alerts, breach notifications, image matches, consent record, e-mail alerts.
Real (in-browser only): navigation, filters, state changes, localStorage persistence, print-to-PDF.
