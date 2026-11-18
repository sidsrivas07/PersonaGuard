// ALL DEMONSTRATION DATA LIVES HERE. Nothing below came from a real scan.
// Components never define their own sample data; they read it from the context (see AppContext.jsx).

export const BASE_SCORE = 68; // demo exposure score from the project presentation (0-100, lower is safer)

export const SOURCES = [
  'LinkedIn (public)',
  'Personal blog, 2019',
  'Breach database',
  'GitHub (public)',
  'Public web search',
  'Simulated demo dataset',
];

// Compact rows: [title, source, category, severity, dateFound, recommendedAction, status]
// 27 rows = 4 Critical + 7 High + 9 Medium + 7 Low, matching the presentation (4/7/9/7).
const rows = [
  ['E-mail found in a 2021 credential dump', 'Breach database', 'Breach', 'Critical', '2026-10-14', 'Change password and enable 2FA', 'Open'],
  ['Password hash in a simulated paste dump', 'Breach database', 'Breach', 'Critical', '2026-10-14', 'Change reused passwords; use a password manager', 'Open'],
  ['Phone and e-mail in a leaked marketing list', 'Breach database', 'Contact info', 'Critical', '2026-10-12', 'Change credentials and watch for phishing', 'Open'],
  ['Date of birth and home address in a directory listing', 'Public web search', 'Personal details', 'Critical', '2026-10-12', 'Send a removal request to the directory', 'Open'],
  ['Mobile number visible on public profile', 'LinkedIn (public)', 'Contact info', 'High', '2026-10-14', 'Hide contact info', 'Reviewing'],
  ['Commit history exposes personal e-mail', 'GitHub (public)', 'Contact info', 'High', '2026-10-13', 'Use the no-reply commit e-mail', 'Open'],
  ['Old forum profile lists phone number', 'Public web search', 'Contact info', 'High', '2026-10-13', 'Edit or delete the forum profile', 'Open'],
  ['Public résumé PDF shows home address', 'Public web search', 'Personal details', 'High', '2026-10-11', 'Remove the address from the résumé', 'Open'],
  ['Handle linked to full name on an old account', 'Public web search', 'Social profile', 'High', '2026-10-11', 'Review account visibility', 'Open'],
  ['Public friends list reveals family members', 'Public web search', 'Social profile', 'High', '2026-10-10', 'Set the friends list to private', 'Open'],
  ['Candidate image match on a public page (simulated)', 'Simulated demo dataset', 'Image match', 'High', '2026-10-10', 'Review the match, then confirm or reject it', 'Open'],
  ['Home city, school name and date of birth', 'Personal blog, 2019', 'Personal details', 'Medium', '2026-10-09', 'Request removal', 'Reviewing'],
  ['Bio shows city and workplace', 'LinkedIn (public)', 'Social profile', 'Medium', '2026-10-09', 'Shorten the public bio', 'Open'],
  ['Old Q&A profile uses real name', 'Public web search', 'Social profile', 'Medium', '2026-10-08', 'Deactivate the unused profile', 'Open'],
  ['Alumni directory lists graduation year', 'Public web search', 'Personal details', 'Medium', '2026-10-08', 'Ask the directory to hide it', 'Open'],
  ['Public comments reveal daily routine', 'Personal blog, 2019', 'Personal details', 'Medium', '2026-10-07', 'Remove or edit the comments', 'Open'],
  ['Event attendance list is public', 'Public web search', 'Social profile', 'Medium', '2026-10-07', 'Make attendance private', 'Open'],
  ['Public repos list a university e-mail', 'GitHub (public)', 'Contact info', 'Medium', '2026-10-06', 'Replace with a no-reply address', 'Open'],
  ['Profile photo reused across sites (simulated)', 'Simulated demo dataset', 'Image match', 'Medium', '2026-10-06', 'Use different photos per site', 'Open'],
  ['Old portfolio page shows age', 'Personal blog, 2019', 'Personal details', 'Medium', '2026-10-05', 'Remove the age line', 'Open'],
  ['Username reused on a gaming forum', 'Public web search', 'Social profile', 'Low', '2026-10-05', 'Use unique usernames', 'Open'],
  ['Public follower count and interests', 'LinkedIn (public)', 'Social profile', 'Low', '2026-10-04', 'Limit who can see connections', 'Open'],
  ['Old blog post mentions hobbies', 'Personal blog, 2019', 'Personal details', 'Low', '2026-10-04', 'Archive the post', 'Open'],
  ['Starred repositories reveal interests', 'GitHub (public)', 'Social profile', 'Low', '2026-10-03', 'Hide starred repositories', 'Open'],
  ['Search snippet shows full name', 'Public web search', 'Personal details', 'Low', '2026-10-03', 'No action needed; monitor', 'Open'],
  ['Outdated bio on inactive profile', 'LinkedIn (public)', 'Social profile', 'Low', '2026-10-02', 'Update or remove the bio', 'Open'],
  ['Username appears on a public tag page', 'Public web search', 'Social profile', 'Low', '2026-10-02', 'No action needed; monitor', 'Open'],
];

export const initialFindings = rows.map((r, i) => ({
  id: i + 1,
  title: r[0],
  source: r[1],
  category: r[2],
  severity: r[3],
  dateFound: r[4],
  recommendedAction: r[5],
  status: r[6], // Open | Reviewing | Resolved
  confidence: 78 + ((i * 7) % 20), // simulated AI classifier confidence (NOT a face-match score)
}));

// Each remediation action can resolve some findings (by id) and lowers the exposure score by `impact`.
export const initialRemediation = [
  { id: 1, title: 'Change breached passwords and enable 2FA', priority: 'Critical', status: 'Pending', impact: 6, findingIds: [1, 2, 3],
    description: 'Passwords seen in breach data should be treated as compromised.',
    steps: ['Change the password on each affected account.', 'Never reuse a password across sites.', 'Turn on two-factor authentication where available.'] },
  { id: 2, title: 'Remove personal details from directories and résumé', priority: 'High', status: 'Pending', impact: 4, findingIds: [4, 8, 15],
    description: 'Home address and date of birth are used in identity fraud.',
    steps: ['Edit the résumé to show city only.', 'Use the takedown template below for directory sites.'] },
  { id: 3, title: 'Hide your phone number on public profiles', priority: 'High', status: 'Pending', impact: 3, findingIds: [5, 7],
    description: 'Public phone numbers lead to spam, scams and SIM-swap attempts.',
    steps: ['Open profile privacy settings.', 'Set contact info visibility to connections only or private.'] },
  { id: 4, title: 'Review public profile visibility', priority: 'High', status: 'Pending', impact: 3, findingIds: [9, 10, 13, 14],
    description: 'Limit what strangers can see on social and professional profiles.',
    steps: ['Switch friends and connections lists to private.', 'Deactivate profiles you no longer use.'] },
  { id: 5, title: 'Request removal of 2019 blog personal details', priority: 'Medium', status: 'Pending', impact: 3, findingIds: [12, 16, 20],
    description: 'Old posts still show your city, school and date of birth.',
    steps: ['Edit or unpublish the posts.', 'Ask the search engine to refresh the cached result.'] },
  { id: 6, title: 'Use a no-reply e-mail for code commits', priority: 'Medium', status: 'Pending', impact: 1, findingIds: [6, 18],
    description: 'Commit metadata exposes your personal e-mail address.',
    steps: ['Enable "keep my e-mail private" in GitHub settings.', 'Set the no-reply address in your git config.'] },
  { id: 7, title: 'Prepare a takedown-request template', priority: 'Low', status: 'Pending', impact: 2, findingIds: [],
    description: 'A ready-to-edit message you can send to a site owner. PersonaGuard does not send it for you.',
    steps: ['Copy the template.', 'Fill in the page URL and your details.', 'Send it yourself to the site contact.'],
    template: 'Subject: Request to remove my personal information\n\nHello,\n\nThe page at [URL] shows my personal information ([what is shown]). I am the person concerned and I do not consent to its publication. Please remove it within [30] days and confirm by reply.\n\nThank you,\n[Your name]' },
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

// Past exposure scores (lower is safer). The last point is replaced by the live score in the dashboard.
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

// SIMULATED image-match candidates. Not real web results. Replace with the face-matching module's output later.
export const imageMatches = [
  { id: 1, source: 'Simulated demo dataset', reference: 'demo_page_a/photo_03.jpg', similarity: 91 },
  { id: 2, source: 'Simulated demo dataset', reference: 'demo_page_b/avatar.png', similarity: 74 },
  { id: 3, source: 'Simulated demo dataset', reference: 'demo_page_c/team.jpg', similarity: 58 },
];
