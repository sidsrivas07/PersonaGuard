// ALL DEMONSTRATION DATA LIVES HERE. Single source of truth for all demo state.
// Components never define their own sample data; they read it from context.

// ── SEVERITY WEIGHTS & EXPOSURE SCORE FORMULA ─────────────────────────
// The exposure score (0-100, lower is safer) is calculated from open findings.
// Formula:
//   Score = Math.min(100, Math.round(
//     openCritical * 7.5 +
//     openHigh     * 3.0 +
//     openMedium   * 1.5 +
//     openLow      * 0.5
//   ))
//
// Initial open state:
//   4 Critical * 7.5 = 30.0
//   7 High     * 3.0 = 21.0
//   9 Medium   * 1.5 = 13.5
//   7 Low      * 0.5 =  3.5
//   Total            = 68.0 (exactly 68 / 100)
export const SEVERITY_WEIGHTS = {
  Critical: 7.5,
  High: 3.0,
  Medium: 1.5,
  Low: 0.5,
};

export function computeExposureScore(findingsList) {
  if (!findingsList || !Array.isArray(findingsList)) return 0;
  const open = findingsList.filter((f) => f.status !== 'Resolved');
  const raw = open.reduce((sum, f) => sum + (SEVERITY_WEIGHTS[f.severity] || 0), 0);
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export const SOURCES = [
  'LinkedIn (public)',
  'Personal blog, 2019',
  'Breach database',
  'GitHub (public)',
  'Public web search',
  'Simulated demo dataset',
];

// 27 findings: 4 Critical, 7 High, 9 Medium, 7 Low across 6 sources.
// Every finding contains: id, source, title, maskedValue, severity, status, recommendedAction, category, dateFound.
export const initialFindings = [
  // ── 4 Critical (4 * 7.5 = 30) ───────────────────────────────────────
  {
    id: 1,
    title: 'E-mail found in a 2021 credential dump',
    source: 'Breach database',
    category: 'Breach',
    severity: 'Critical',
    maskedValue: 's***@example.com',
    status: 'Open',
    dateFound: '2026-10-14',
    recommendedAction: 'Change password and enable 2FA',
    confidence: 94,
  },
  {
    id: 2,
    title: 'Password hash in a simulated paste dump',
    source: 'Breach database',
    category: 'Breach',
    severity: 'Critical',
    maskedValue: 'sha256:7f83b165...',
    status: 'Open',
    dateFound: '2026-10-14',
    recommendedAction: 'Change reused passwords; use a password manager',
    confidence: 92,
  },
  {
    id: 3,
    title: 'Phone and e-mail in a leaked marketing list',
    source: 'Breach database',
    category: 'Contact info',
    severity: 'Critical',
    maskedValue: '+91 98****21',
    status: 'Open',
    dateFound: '2026-10-12',
    recommendedAction: 'Change credentials and watch for phishing',
    confidence: 89,
  },
  {
    id: 4,
    title: 'Date of birth and home address in a directory listing',
    source: 'Public web search',
    category: 'Personal details',
    severity: 'Critical',
    maskedValue: '14/08/****, 42 Elm St.',
    status: 'Open',
    dateFound: '2026-10-12',
    recommendedAction: 'Send a removal request to the directory',
    confidence: 91,
  },

  // ── 7 High (7 * 3.0 = 21) ───────────────────────────────────────────
  {
    id: 5,
    title: 'Mobile number visible on public profile',
    source: 'LinkedIn (public)',
    category: 'Contact info',
    severity: 'High',
    maskedValue: '+91 90****00',
    status: 'Open',
    dateFound: '2026-10-14',
    recommendedAction: 'Hide contact info',
    confidence: 88,
  },
  {
    id: 6,
    title: 'Commit history exposes personal e-mail',
    source: 'GitHub (public)',
    category: 'Contact info',
    severity: 'High',
    maskedValue: 'sid.srivas0402@***.com',
    status: 'Open',
    dateFound: '2026-10-13',
    recommendedAction: 'Use the no-reply commit e-mail',
    confidence: 85,
  },
  {
    id: 7,
    title: 'Old forum profile lists phone number',
    source: 'Public web search',
    category: 'Contact info',
    severity: 'High',
    maskedValue: '+91 91****34',
    status: 'Open',
    dateFound: '2026-10-13',
    recommendedAction: 'Edit or delete the forum profile',
    confidence: 84,
  },
  {
    id: 8,
    title: 'Public résumé PDF shows home address',
    source: 'Public web search',
    category: 'Personal details',
    severity: 'High',
    maskedValue: 'Flat 4B, Green Park...',
    status: 'Open',
    dateFound: '2026-10-11',
    recommendedAction: 'Remove the address from the résumé',
    confidence: 86,
  },
  {
    id: 9,
    title: 'Handle linked to full name on an old account',
    source: 'Public web search',
    category: 'Social profile',
    severity: 'High',
    maskedValue: '@sid_srivas07',
    status: 'Open',
    dateFound: '2026-10-11',
    recommendedAction: 'Review account visibility',
    confidence: 82,
  },
  {
    id: 10,
    title: 'Public friends list reveals family members',
    source: 'Public web search',
    category: 'Social profile',
    severity: 'High',
    maskedValue: '8 close relatives visible',
    status: 'Open',
    dateFound: '2026-10-10',
    recommendedAction: 'Set the friends list to private',
    confidence: 80,
  },
  {
    id: 11,
    title: 'Candidate image match on a public page (simulated)',
    source: 'Simulated demo dataset',
    category: 'Image match',
    severity: 'High',
    maskedValue: 'candidate_1.jpg (91% sim)',
    status: 'Open',
    dateFound: '2026-10-10',
    recommendedAction: 'Review the match, then confirm or reject it',
    confidence: 91,
  },

  // ── 9 Medium (9 * 1.5 = 13.5) ───────────────────────────────────────
  {
    id: 12,
    title: 'Home city, school name and date of birth',
    source: 'Personal blog, 2019',
    category: 'Personal details',
    severity: 'Medium',
    maskedValue: 'Bengaluru, 199*',
    status: 'Open',
    dateFound: '2026-10-09',
    recommendedAction: 'Request removal',
    confidence: 79,
  },
  {
    id: 13,
    title: 'Bio shows city and workplace',
    source: 'LinkedIn (public)',
    category: 'Social profile',
    severity: 'Medium',
    maskedValue: 'Senior Engineer @ ...',
    status: 'Open',
    dateFound: '2026-10-09',
    recommendedAction: 'Shorten the public bio',
    confidence: 76,
  },
  {
    id: 14,
    title: 'Old Q&A profile uses real name',
    source: 'Public web search',
    category: 'Social profile',
    severity: 'Medium',
    maskedValue: 'User "Siddhant S."',
    status: 'Open',
    dateFound: '2026-10-08',
    recommendedAction: 'Deactivate the unused profile',
    confidence: 81,
  },
  {
    id: 15,
    title: 'Alumni directory lists graduation year',
    source: 'Public web search',
    category: 'Personal details',
    severity: 'Medium',
    maskedValue: 'B.Tech, Class of 202*',
    status: 'Open',
    dateFound: '2026-10-08',
    recommendedAction: 'Ask the directory to hide it',
    confidence: 75,
  },
  {
    id: 16,
    title: 'Public comments reveal daily routine',
    source: 'Personal blog, 2019',
    category: 'Personal details',
    severity: 'Medium',
    maskedValue: '3 posts with schedule info',
    status: 'Open',
    dateFound: '2026-10-07',
    recommendedAction: 'Remove or edit the comments',
    confidence: 78,
  },
  {
    id: 17,
    title: 'Event attendance list is public',
    source: 'Public web search',
    category: 'Social profile',
    severity: 'Medium',
    maskedValue: 'PersonaConf 2026 attendee',
    status: 'Open',
    dateFound: '2026-10-07',
    recommendedAction: 'Make attendance private',
    confidence: 77,
  },
  {
    id: 18,
    title: 'Public repos list a university e-mail',
    source: 'GitHub (public)',
    category: 'Contact info',
    severity: 'Medium',
    maskedValue: 'sid@univ.edu',
    status: 'Open',
    dateFound: '2026-10-06',
    recommendedAction: 'Replace with a no-reply address',
    confidence: 83,
  },
  {
    id: 19,
    title: 'Profile photo reused across sites (simulated)',
    source: 'Simulated demo dataset',
    category: 'Image match',
    severity: 'Medium',
    maskedValue: 'avatar_photo.png',
    status: 'Open',
    dateFound: '2026-10-06',
    recommendedAction: 'Use different photos per site',
    confidence: 74,
  },
  {
    id: 20,
    title: 'Old portfolio page shows age',
    source: 'Personal blog, 2019',
    category: 'Personal details',
    severity: 'Medium',
    maskedValue: 'Age: 2*',
    status: 'Open',
    dateFound: '2026-10-05',
    recommendedAction: 'Remove the age line',
    confidence: 73,
  },

  // ── 7 Low (7 * 0.5 = 3.5) ───────────────────────────────────────────
  {
    id: 21,
    title: 'Username reused on a gaming forum',
    source: 'Public web search',
    category: 'Social profile',
    severity: 'Low',
    maskedValue: 'sid_gamer_99',
    status: 'Open',
    dateFound: '2026-10-05',
    recommendedAction: 'Use unique usernames',
    confidence: 72,
  },
  {
    id: 22,
    title: 'Public follower count and interests',
    source: 'LinkedIn (public)',
    category: 'Social profile',
    severity: 'Low',
    maskedValue: '500+ connections visible',
    status: 'Open',
    dateFound: '2026-10-04',
    recommendedAction: 'Limit who can see connections',
    confidence: 70,
  },
  {
    id: 23,
    title: 'Old blog post mentions hobbies',
    source: 'Personal blog, 2019',
    category: 'Personal details',
    severity: 'Low',
    maskedValue: 'Rock climbing, photography',
    status: 'Open',
    dateFound: '2026-10-04',
    recommendedAction: 'Archive the post',
    confidence: 71,
  },
  {
    id: 24,
    title: 'Starred repositories reveal interests',
    source: 'GitHub (public)',
    category: 'Social profile',
    severity: 'Low',
    maskedValue: '14 private tool forks',
    status: 'Open',
    dateFound: '2026-10-03',
    recommendedAction: 'Hide starred repositories',
    confidence: 69,
  },
  {
    id: 25,
    title: 'Search snippet shows full name',
    source: 'Public web search',
    category: 'Personal details',
    severity: 'Low',
    maskedValue: 'Siddhant Srivastava',
    status: 'Open',
    dateFound: '2026-10-03',
    recommendedAction: 'No action needed; monitor',
    confidence: 68,
  },
  {
    id: 26,
    title: 'Outdated bio on inactive profile',
    source: 'LinkedIn (public)',
    category: 'Social profile',
    severity: 'Low',
    maskedValue: 'Student at...',
    status: 'Open',
    dateFound: '2026-10-02',
    recommendedAction: 'Update or remove the bio',
    confidence: 67,
  },
  {
    id: 27,
    title: 'Username appears on a public tag page',
    source: 'Public web search',
    category: 'Social profile',
    severity: 'Low',
    maskedValue: '@sid_srivas07 tagged in 2 photos',
    status: 'Open',
    dateFound: '2026-10-02',
    recommendedAction: 'No action needed; monitor',
    confidence: 66,
  },
];

// Initial score computed dynamically from seed findings (must equal exactly 68)
export const BASE_SCORE = computeExposureScore(initialFindings);

// Each remediation action links to findings and provides guidance
export const initialRemediation = [
  {
    id: 1,
    title: 'Change breached passwords and enable 2FA',
    priority: 'Critical',
    status: 'Pending',
    impact: 15,
    findingIds: [1, 2, 3],
    description: 'Passwords seen in breach data should be treated as compromised.',
    steps: [
      'Change the password on each affected account.',
      'Never reuse a password across sites.',
      'Turn on two-factor authentication where available.',
    ],
  },
  {
    id: 2,
    title: 'Remove personal details from directories and résumé',
    priority: 'High',
    status: 'Pending',
    impact: 13.5,
    findingIds: [4, 8, 15],
    description: 'Home address and date of birth are used in identity fraud.',
    steps: [
      'Edit the résumé to show city only.',
      'Use the takedown template below for directory sites.',
    ],
  },
  {
    id: 3,
    title: 'Hide your phone number on public profiles',
    priority: 'High',
    status: 'Pending',
    impact: 6,
    findingIds: [5, 7],
    description: 'Public phone numbers lead to spam, scams and SIM-swap attempts.',
    steps: [
      'Open profile privacy settings.',
      'Set contact info visibility to connections only or private.',
    ],
  },
  {
    id: 4,
    title: 'Review public profile visibility',
    priority: 'High',
    status: 'Pending',
    impact: 9,
    findingIds: [9, 10, 13, 14],
    description: 'Limit what strangers can see on social and professional profiles.',
    steps: [
      'Switch friends and connections lists to private.',
      'Deactivate profiles you no longer use.',
    ],
  },
  {
    id: 5,
    title: 'Request removal of 2019 blog personal details',
    priority: 'Medium',
    status: 'Pending',
    impact: 4.5,
    findingIds: [12, 16, 20],
    description: 'Old posts still show your city, school and date of birth.',
    steps: [
      'Edit or unpublish the posts.',
      'Ask the search engine to refresh the cached result.',
    ],
  },
  {
    id: 6,
    title: 'Use a no-reply e-mail for code commits',
    priority: 'Medium',
    status: 'Pending',
    impact: 4.5,
    findingIds: [6, 18],
    description: 'Commit metadata exposes your personal e-mail address.',
    steps: [
      'Enable "keep my e-mail private" in GitHub settings.',
      'Set the no-reply address in your git config.',
    ],
  },
  {
    id: 7,
    title: 'Prepare a takedown-request template',
    priority: 'Low',
    status: 'Pending',
    impact: 2,
    findingIds: [],
    description: 'A ready-to-edit message you can send to a site owner. PersonaGuard does not send it for you.',
    steps: [
      'Copy the template.',
      'Fill in the page URL and your details.',
      'Send it yourself to the site contact.',
    ],
    template: 'Subject: Request to remove my personal information\n\nHello,\n\nThe page at [URL] shows my personal information ([what is shown]). I am the person concerned and I do not consent to its publication. Please remove it within [30] days and confirm by reply.\n\nThank you,\n[Your name]',
  },
];

export const initialAlerts = [
  { id: 1, type: 'high-severity', title: 'High-severity finding', message: 'Mobile number is visible on your public LinkedIn profile.', time: '2026-10-14 09:12', read: false },
  { id: 2, type: 'new-finding', title: '3 new findings', message: 'The latest scan found 3 items not seen before.', time: '2026-10-14 09:10', read: false },
  { id: 3, type: 'scan-complete', title: 'Scan completed', message: 'Scan 5 processed 6 sources and found 27 items.', time: '2026-10-14 09:10', read: false },
  { id: 4, type: 'reminder', title: 'Scheduled re-scan due', message: 'Your next demonstration re-scan is due on 2026-10-28.', time: '2026-10-13 08:00', read: true },
  { id: 5, type: 'new-finding', title: 'New breach notification (simulated)', message: 'Your e-mail appears in a simulated 2021 credential dump.', time: '2026-10-01 10:30', read: true },
  { id: 6, type: 'scan-complete', title: 'Scan completed', message: 'Scan 4 processed 6 sources and found 25 items.', time: '2026-09-30 09:05', read: true },
];

export const initialScans = [
  { id: 'Scan 5', date: '2026-10-14 09:10', status: 'Completed', findings: 27, sources: 6 },
  { id: 'Scan 4', date: '2026-09-30 09:05', status: 'Completed', findings: 25, sources: 6 },
  { id: 'Scan 3b', date: '2026-09-23 09:00', status: 'Failed', findings: 0, sources: 2, error: 'Simulated failure: Breach database timed out.' },
  { id: 'Scan 3', date: '2026-09-16 09:02', status: 'Completed', findings: 22, sources: 5 },
  { id: 'Scan 2', date: '2026-09-02 09:00', status: 'Completed', findings: 20, sources: 5 },
  { id: 'Scan 1', date: '2026-08-19 09:00', status: 'Completed', findings: 18, sources: 5 },
];

// Historical trend scans: the last point is replaced dynamically with the live score
export const TREND_HISTORY = [
  { label: 'Scan 1', score: 86 },
  { label: 'Scan 2', score: 81 },
  { label: 'Scan 3', score: 74 },
  { label: 'Scan 4', score: 70 },
  { label: 'Scan 5', score: 68 },
];

export const initialProfile = {
  fullName: 'Demo User',
  email: 'demo.user@example.com',
  phone: '+91 90000 00000',
  handles: { linkedin: 'demo-user', github: 'demo-user', instagram: 'demo.user', x: 'demo_user' },
  consentGiven: true,
  consentDate: '2026-08-19',
};

export const initialSettings = { emailAlerts: true, scanReminder: 'Every 2 weeks' };

export const imageMatches = [
  { id: 1, source: 'Simulated demo dataset', reference: 'demo_page_a/photo_03.jpg', similarity: 91 },
  { id: 2, source: 'Simulated demo dataset', reference: 'demo_page_b/avatar.png', similarity: 74 },
  { id: 3, source: 'Simulated demo dataset', reference: 'demo_page_c/team.jpg', similarity: 58 },
];
