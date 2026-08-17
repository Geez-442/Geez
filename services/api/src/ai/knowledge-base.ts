import { Role } from '../auth.stub';

export interface KnowledgeEntry {
  id: string;
  roles: Role[];
  keywords: string[];
  title: string;
  content: string;
  sources: string[];
}

const ALL_ROLES = [Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator, Role.Public_Observer];

/**
 * Static knowledge base for the ZETA grounded advisory adapter.
 *
 * Organised into four families:
 *   1. NAVIGATION  — how to use the ZETS portals (helps users find their way around)
 *   2. REGISTRATION & ACCESS — accounts, approval workflow, roles
 *   3. PROCUREMENT PROCESS — bidding, sealing, evaluation, awards, thresholds
 *   4. OVERSIGHT & COMPLIANCE — audit, anomalies, transparency, COI
 *
 * These entries are simplified summaries for the research prototype and are not
 * a substitute for legal advice. They cite the PPDPA Act and PRAZ eGP framework
 * conceptually; a production deployment should index the official PRAZ standard
 * bidding documents and applicable statutory instruments.
 */
export const ZETA_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. NAVIGATION — helping users move around the system
  // ─────────────────────────────────────────────────────────────
  {
    id: 'nav-overview',
    roles: ALL_ROLES,
    keywords: ['navigate', 'navigation', 'where do i', 'how do i use', 'get started', 'getting started', 'lost', 'help me', 'portal', 'menu', 'find my way'],
    title: 'Getting around ZETS',
    content:
      'ZETS has five workspaces, each reached from the home page after signing in:\n• Supplier Portal (/supplier) — browse open tenders, create and seal bids.\n• PMU Portal (/pmu) — draft, publish, evaluate and award tenders.\n• PRAZ Portal (/praz) — approve registrations, review audit trails and anomaly flags.\n• Transparency Portal (/public) — open to everyone, no login needed.\n• Offline Workspace (/offline/bid-draft) — write bid drafts without internet.\nYou are routed to your own portal automatically when you log in. The ZETA button in the bottom-right corner is available on every page.',
    sources: ['ZETS User Guide'],
  },
  {
    id: 'nav-supplier-portal',
    roles: [Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['supplier portal', 'supplier workspace', 'my bids', 'where are my bids', 'find tenders', 'browse tenders'],
    title: 'Using the Supplier Portal',
    content:
      'The Supplier Portal has three areas:\n1. The map of Zimbabwe at the top — click any province to filter tenders to that region; click it again to clear the filter.\n2. Open Tenders (left) — each card shows the deadline and budget, with a form to enter your bid amount, company name and conflict declaration. Press "Create Draft Bid" to save it.\n3. My Bids (right) — your drafts and sealed bids. Draft bids show a "Seal Bid" form; once sealed, a bid cannot be changed.\nThe Online/Offline badge in the top bar tells you whether your connection is live.',
    sources: ['ZETS User Guide'],
  },
  {
    id: 'nav-pmu-portal',
    roles: [Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['pmu portal', 'pmu workspace', 'tabs', 'draft tender tab', 'evaluate tab', 'command center', 'where do i create'],
    title: 'Using the PMU Portal',
    content:
      'The PMU Portal is organised into four tabs:\n• Draft Tender — the creation form. Fill in title, entity, type, budget and deadline, then press "Run ZETA Pre-Check" to validate compliance before pressing "Create Tender".\n• Active Tenders — every tender you own. Draft tenders show a "Publish Tender" button; publishing makes them visible to suppliers.\n• Evaluate Bids — paste a tender ID, press "Load Review" to see sealed bids after the deadline, then select the winning bid and record your decision note.\n• Oversight — anomaly flags and recent audit events for your own assurance.',
    sources: ['ZETS User Guide'],
  },
  {
    id: 'nav-praz-portal',
    roles: [Role.PRAZ_Regulator],
    keywords: ['praz portal', 'praz dashboard', 'oversight dashboard', 'approve users', 'approval queue', 'where do i approve'],
    title: 'Using the PRAZ Oversight Dashboard',
    content:
      'The PRAZ dashboard is laid out top to bottom:\n1. Statistics row — open tenders, awards, anomaly flags, and how many registrations are waiting for you.\n2. Pending Registration Requests — each card shows the applicant\u2019s name, email, requested role and PRAZ vendor number. Press "Approve" to enable their login, or "Decline" to reject it.\n3. Regional map with the anomaly overlay — provinces turn red where tender concentration is unusually high.\n4. Audit Trail and Anomaly Flags side by side. Press "Scan Now" to run a fresh anomaly scan, and "Mark Reviewed" to close off a flag you have investigated.',
    sources: ['ZETS User Guide'],
  },
  {
    id: 'nav-map',
    roles: ALL_ROLES,
    keywords: ['map', 'province', 'provinces', 'region', 'regional', 'harare', 'bulawayo', 'masvingo', 'midlands', 'matabeleland', 'manicaland', 'mashonaland', 'filter by region'],
    title: 'Using the regional map',
    content:
      'The interactive map covers all ten of Zimbabwe\u2019s provinces: Harare, Bulawayo, Manicaland, Mashonaland Central, Mashonaland East, Mashonaland West, Masvingo, Matabeleland North, Matabeleland South and Midlands. A numbered badge on a province shows how many tenders are active there. Click a province to filter the tender list below; click again or press "Clear filter" to see everything. On the PRAZ dashboard the same map adds an anomaly overlay, shading provinces red where activity is disproportionately concentrated — a recognised red flag for procurement irregularity.',
    sources: ['ZETS User Guide', 'Zimbabwe provincial administrative divisions'],
  },
  {
    id: 'nav-zeta-assistant',
    roles: ALL_ROLES,
    keywords: ['zeta', 'assistant', 'chatbot', 'ai', 'what can you do', 'who are you', 'help button', 'support'],
    title: 'What ZETA can and cannot do',
    content:
      'I am ZETA, the advisory assistant embedded in ZETS. I can explain PRAZ rules, procurement thresholds, deadlines, conflict-of-interest obligations, and how to navigate any part of this system. I also help format your inputs as you type — PRAZ vendor numbers, currency amounts and entity names.\nI cannot see sealed bid amounts, approve registrations, publish tenders, or make award decisions. Those actions belong to authorised human officers. When I have no grounded answer I will say so and point you to a human rather than guess.',
    sources: ['ZETS ZETA design constraints'],
  },
  {
    id: 'nav-form-assistance',
    roles: ALL_ROLES,
    keywords: ['form', 'input', 'field', 'formatting', 'autocomplete', 'suggestion', 'caps', 'uppercase', 'why did my text change'],
    title: 'Why fields reformat as I type',
    content:
      'Fields marked with the "ZETA AI" badge validate and reformat your input live, so records stay consistent:\n• PRAZ vendor number — forced to uppercase, restricted to letters, numbers and dashes, and prefixed with PRAZ- automatically.\n• Titles and entity names — each word is capitalised.\n• Budget and bid amounts — shown with thousand separators, plus a note telling you which procurement threshold the figure falls into.\n• Tender IDs — forced to uppercase alphanumerics.\nThis prevents the formatting mistakes that most often cause a submission to be rejected.',
    sources: ['ZETS ZETA form assistance design'],
  },
  {
    id: 'nav-offline',
    roles: [Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['offline', 'no internet', 'connection', 'connectivity', 'sync', 'data bundle', 'low bandwidth', 'save locally'],
    title: 'Working without a reliable connection',
    content:
      'The Offline Workspace at /offline/bid-draft lets you compose bid drafts with no internet at all. Drafts are held in your browser\u2019s local storage on your own device and nothing is transmitted until you choose to sync. When you are back online and signed in, press "Sync N Drafts" to upload them; any that fail stay in the list and are marked so you can retry. This is designed for suppliers on intermittent or metered connections, so SMEs outside the major cities are not shut out of public procurement.',
    sources: ['ZETS offline-first design', 'PPDPA Act Chapter 22:23 (equal access to procurement)'],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. REGISTRATION & ACCESS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'supplier-registration',
    roles: ALL_ROLES,
    keywords: ['register', 'registration', 'praz vendor', 'vendor number', 'how do i join', 'supplier account', 'sign up', 'create account'],
    title: 'How do I register on ZETS?',
    content:
      'Open the home page, choose the "Register" tab, and supply your email, a password of at least 8 characters, your display name, the account type you need, and your PRAZ vendor or entity number. Public Observer accounts do not require a PRAZ number. Suppliers must already hold PRAZ e-registration, which normally requires valid tax clearance, company registration, bank details and category selections. After you submit, your account waits for PRAZ administrator approval before you can log in.',
    sources: ['PPDPA Act Chapter 22:23 (procurement participant registration)', 'PRAZ eGP Supplier Guide (conceptual)'],
  },
  {
    id: 'approval-workflow',
    roles: ALL_ROLES,
    keywords: ['pending', 'pending approval', 'awaiting approval', 'cannot log in', 'cant login', 'why cant i sign in', 'approved', 'rejected', 'declined', 'how long', 'account status'],
    title: 'Why can I not log in yet?',
    content:
      'Every new registration starts in PENDING_APPROVAL. A PRAZ Regulator must verify your details — particularly your PRAZ vendor or entity number — before your login is enabled. Until then, signing in returns "Your registration is awaiting PRAZ Administrator approval". Once approved you can log in normally and are taken straight to the portal for your role. If your application is declined you will see "Your registration request was declined by PRAZ"; contact the PRAZ helpdesk to find out why and what to correct. This gate exists so that only verified, PRAZ-registered participants can transact.',
    sources: ['PPDPA Act Chapter 22:23 (verification of procurement participants)', 'ZETS access-control design'],
  },
  {
    id: 'roles-explained',
    roles: ALL_ROLES,
    keywords: ['role', 'roles', 'permission', 'permissions', 'access', 'what can i do', 'account type', 'separation of duties', 'who does what'],
    title: 'What the four roles can do',
    content:
      'ZETS enforces separation of duties across four roles:\n• Supplier — browses published tenders, creates draft bids, seals them with a COI declaration. Cannot create tenders.\n• PMU Officer — drafts, publishes and evaluates tenders and records award decisions. Cannot approve user registrations.\n• PRAZ Regulator — approves or declines registrations, reviews the audit trail, runs anomaly scans. Independent oversight.\n• Public Observer — reads the transparency dashboard only.\nYou never choose a role at login; it is read from your verified account record on the server. This prevents privilege escalation by tampering with the login form.',
    sources: ['PPDPA Act Chapter 22:23 (separation of duties)', 'ZETS RBAC design'],
  },
  {
    id: 'login-no-role',
    roles: ALL_ROLES,
    keywords: ['login', 'log in', 'sign in', 'select role', 'choose role', 'no role option', 'where is the role dropdown'],
    title: 'Why does login not ask for my role?',
    content:
      'You only enter your email and password. Your role is looked up server-side from your approved account and returned inside a signed JSON Web Token, then you are redirected to the matching portal. Allowing a user to declare their own role at login would be a security weakness, since anyone could claim to be a regulator. If you land on a portal that says "Access denied", you are signed in under a different role than that portal serves — sign out and check which account you used.',
    sources: ['ZETS authentication design', 'OWASP Authentication Cheat Sheet'],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. PROCUREMENT PROCESS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'tender-eligibility',
    roles: [Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['eligible', 'eligibility', 'can i bid', 'requirements', 'criteria', 'pre-qualification', 'qualify'],
    title: 'How do I check if I am eligible for a tender?',
    content:
      'Read the tender notice and bidding documents carefully. Eligibility criteria usually cover tax compliance, registration category, prior experience, financial capacity, and absence of conflicts of interest. If any requirement is unclear, request a clarification through the portal before the deadline rather than assuming — a bid that misses a mandatory requirement is normally disqualified at the preliminary examination stage regardless of price.',
    sources: ['PRAZ Standard Bidding Documents (conceptual)', 'PPDPA Act § on bidder qualifications'],
  },
  {
    id: 'how-to-bid',
    roles: [Role.Supplier, Role.PMU_Officer],
    keywords: ['how to bid', 'submit bid', 'place bid', 'draft bid', 'bidding process', 'steps to bid', 'create bid'],
    title: 'How to submit a bid, step by step',
    content:
      '1. Sign in and open the Supplier Portal.\n2. Find the tender under Open Tenders, optionally filtering by province on the map.\n3. Check the deadline and the budget shown on the card.\n4. Enter your bid amount, your registered company name, and any conflicts of interest.\n5. Press "Create Draft Bid". The bid is saved as a draft and is still editable.\n6. Go to My Bids, complete the conflict declaration, tick the confirmation box, and press "Seal Bid".\nOnly sealed bids are considered. A draft left unsealed at the deadline is not evaluated.',
    sources: ['ZETS User Guide', 'PRAZ Standard Bidding Documents (conceptual)'],
  },
  {
    id: 'sealing-explained',
    roles: [Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['seal', 'sealing', 'sealed', 'what does sealing mean', 'can i change my bid', 'edit bid', 'unseal', 'withdraw'],
    title: 'What sealing a bid means',
    content:
      'Sealing encrypts your bid amount and locks your conflict-of-interest declaration. From that moment the bid is immutable — you cannot edit the amount, and neither can anyone else, which is what makes the record trustworthy. Seal only when you are satisfied with your figure. If you must change a sealed bid, contact the procuring entity through the official clarification channel; whether a substitution is permitted before the deadline is governed by the tender conditions, not by this system.',
    sources: ['ZETS Bid Vault design', 'PPDPA Act Chapter 22:23 (bid submission and modification)'],
  },
  {
    id: 'sealed-bid-confidentiality',
    roles: [Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['confidential', 'confidentiality', 'sealed', 'who can see my bid', 'encryption', 'amount', 'secure', 'privacy'],
    title: 'Who can see my sealed bid amount before the deadline?',
    content:
      'No one — including me. ZETS encrypts bid amounts with AES-256 and applies application-level time-lock sealing, so PMU and PRAZ users can only decrypt amounts after the deadline has passed. ZETA is architecturally barred from reading sealed bid contents at any point, which is why I can discuss process and rules but never tell you what a competitor has bid.',
    sources: ['ZETS Bid Vault design'],
  },
  {
    id: 'deadlines',
    roles: ALL_ROLES,
    keywords: ['deadline', 'closing date', 'late', 'missed deadline', 'extension', 'time', 'how long do i have', 'when does it close'],
    title: 'Deadlines and late submissions',
    content:
      'Each tender card shows its closing date and time. Bids must be sealed before that moment; the system will not accept a seal afterwards, and a late bid cannot be considered — this is a fairness rule, not a technical limitation. PRAZ practice is to allow a reasonable advertising window, commonly at least fourteen days for open tenders, so that smaller firms have a genuine chance to prepare. If a deadline is extended, the tender record and its notice are updated. Do not leave sealing until the final hour if your connection is unreliable; draft offline early instead.',
    sources: ['PPDPA Act Chapter 22:23 (bid submission deadlines)', 'PRAZ Procurement Manual (conceptual)'],
  },
  {
    id: 'thresholds',
    roles: [Role.PMU_Officer, Role.PRAZ_Regulator, Role.Supplier],
    keywords: ['threshold', 'thresholds', 'limit', 'budget limit', 'competitive bidding', 'direct purchase', 'quotation', 'procurement method', 'how much'],
    title: 'Procurement thresholds and methods',
    content:
      'The value of a requirement determines the lawful procurement method. In this prototype the guidance bands are:\n• Micro — direct purchase permitted.\n• From 5,000 — informal or formal quotations required.\n• From 50,000 — competitive bidding threshold; an open tender is required.\n• From 500,000 — major procurement; PRAZ oversight is recommended.\n• From 5,000,000 — strategic procurement; higher-level approval may apply.\nWhen you type a budget, I show which band it falls into. Splitting a requirement into smaller lots to stay under a threshold is a recognised form of procurement abuse and is treated as an anomaly. Confirm the current statutory figures against the prevailing statutory instrument before relying on them.',
    sources: ['PPDPA Act Chapter 22:23 (procurement methods and thresholds)', 'PRAZ threshold circulars (conceptual)'],
  },
  {
    id: 'pmu-publication-checklist',
    roles: [Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['publish tender', 'checklist', 'steps', 'create tender', 'advertise', 'how do i publish'],
    title: 'Checklist: before publishing a tender',
    content:
      '1. Confirm budget allocation and that your procurement method matches the value band.\n2. Draft clear, non-discriminatory specifications — avoid naming a brand where a standard will do.\n3. Set a realistic deadline that allows SME participation.\n4. Attach all required bidding documents.\n5. Verify conflict-of-interest declarations for every evaluation panel member.\n6. Run the ZETA Pre-Check on the draft form to catch threshold and deadline problems.\n7. Publish through ZETS and, where required, in a newspaper of wide circulation.\nA tender stays in Draft and invisible to suppliers until you press Publish.',
    sources: ['PRAZ Procurement Manual (conceptual)', 'PPDPA Act Chapter 22:23'],
  },
  {
    id: 'zeta-precheck',
    roles: [Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['pre-check', 'precheck', 'compliance check', 'validate tender', 'check before publishing', 'ai check'],
    title: 'What the ZETA Pre-Check examines',
    content:
      'Pressing "Run ZETA Pre-Check" on the Draft Tender tab reviews your form before submission and reports: missing mandatory fields such as title and procuring entity; whether the budget crosses the competitive-bidding or major-procurement thresholds; and whether the deadline gives bidders a reasonable window, warning you if it is under fourteen days or already in the past. The check is advisory — it informs your professional judgement and does not authorise or block publication by itself.',
    sources: ['ZETS ZETA pre-check design', 'PPDPA Act Chapter 22:23'],
  },
  {
    id: 'evaluation-open-bids',
    roles: [Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['evaluate', 'open bids', 'review bids', 'award', 'lowest bid', 'scoring', 'evaluation'],
    title: 'How ZETS supports bid evaluation',
    content:
      'After the deadline, authorised PMU and PRAZ users can review sealed bids from the Evaluate Bids tab by loading the tender ID. ZETS decrypts amounts for evaluation but makes no binding award decision. I may summarise anomaly patterns drawn from audit metadata, never from bid amounts. The lowest price does not automatically win: the award goes to the bid that is both substantially responsive to the requirements and best evaluated under the published criteria. The final award must be approved by the accounting officer or delegated authority, and your decision note is written into the immutable audit trail.',
    sources: ['ZETS Evaluation module', 'PPDPA Act Chapter 22:23 (evaluation and award)'],
  },
  {
    id: 'award-process',
    roles: ALL_ROLES,
    keywords: ['award', 'awarded', 'winner', 'who won', 'award notice', 'result', 'outcome', 'notification', 'did i win'],
    title: 'Awards and how you find out',
    content:
      'When a PMU officer records an award, the tender status becomes Awarded, the decision note is stored, and the award notice appears on the public Transparency Portal for anyone to inspect. Suppliers see award status against the relevant tender. Publishing awards openly is a deliberate anti-corruption control: it lets unsuccessful bidders and the public see who won and on what stated basis. If you believe an award was improper, the PPDPA framework provides for challenge and review through PRAZ rather than through this system.',
    sources: ['PPDPA Act Chapter 22:23 (award and notification)', 'Constitution of Zimbabwe §315 (procurement transparency)'],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. OVERSIGHT & COMPLIANCE
  // ─────────────────────────────────────────────────────────────
  {
    id: 'coi-declaration',
    roles: [Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['conflict of interest', 'coi', 'affiliation', 'director', 'family', 'related', 'disclosure', 'declare'],
    title: 'What must I disclose in a Conflict-of-Interest declaration?',
    content:
      'Disclose any direct or indirect interest that could influence the procurement outcome: directorships or shareholdings in competing firms, employment or family ties with procuring entity staff, gifts or hospitality offered or received, and any prior involvement in preparing the tender specifications. COI declarations are mandatory before a bid can be sealed and become immutable afterwards. Declaring an interest does not automatically disqualify you — concealing one is the serious offence, and because the declaration is hash-chained it can be proved after the fact.',
    sources: ['PPDPA Act Chapter 22:23 (conflict of interest provisions)', 'OECD Guidelines on Managing Conflict of Interest'],
  },
  {
    id: 'praz-analytics-overview',
    roles: [Role.PRAZ_Regulator, Role.PMU_Officer],
    keywords: ['analytics', 'monitor', 'oversight', 'transparency', 'corruption', 'anomaly', 'report', 'red flag', 'suspicious'],
    title: 'What oversight analytics ZETA provides',
    content:
      'I analyse audit logs and tender metadata — never sealed bid contents — to flag potential anomalies: repeated submissions from the same supplier, off-hours access by officials, single-bidder awards, rapid bid sealing, and unusual geographic concentration of awards. Findings carry a severity and are advisory only: they mark a pattern worth a human look, not proof of wrongdoing. A regulator investigates and then presses "Mark Reviewed" to close the flag, which is itself recorded.',
    sources: ['ZETS Anomaly Detection design', 'OECD Preventing Corruption in Public Procurement'],
  },
  {
    id: 'audit-trail',
    roles: [Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['audit', 'audit trail', 'audit log', 'hash', 'hash chain', 'tamper', 'evidence', 'history', 'who did what'],
    title: 'How the audit trail resists tampering',
    content:
      'Every significant action — creating a tender, publishing it, sealing a bid, recording an award, approving a user, even asking me a question — is written to the audit log with the actor, their role, a timestamp and the target record. Each entry carries a hash computed over the previous entry\u2019s hash, forming a chain. Altering or deleting a past entry breaks every hash after it, so interference is detectable rather than merely discouraged. The PRAZ dashboard renders this trail newest-first for review.',
    sources: ['ZETS hash-chain audit design', 'PPDPA Act Chapter 22:23 (record keeping)'],
  },
  {
    id: 'public-observer',
    roles: ALL_ROLES,
    keywords: ['public', 'observer', 'view tenders', 'transparency', 'dashboard', 'award notice', 'citizen', 'anyone can see'],
    title: 'What information is publicly available?',
    content:
      'The Transparency Portal at /public needs no login. It shows published tenders with their deadlines and budgets, award notices with decision notes, aggregate oversight statistics including anomaly counts, and the regional distribution map. Sealed bid contents, supplier pricing and evaluation deliberations are never exposed there. This reflects the constitutional requirement that public procurement be transparent, fair and honest while still protecting commercially confidential bid information.',
    sources: ['Constitution of Zimbabwe §315 (procurement transparency)', 'PPDPA Act Chapter 22:23'],
  },
  {
    id: 'sme-participation',
    roles: ALL_ROLES,
    keywords: ['sme', 'small business', 'small supplier', 'barrier', 'access', 'fair', 'inclusion', 'new supplier', 'first time'],
    title: 'How ZETS lowers barriers for smaller suppliers',
    content:
      'Several features exist specifically to widen participation: offline drafting for intermittent or metered connections; AI-assisted fields that prevent the formatting errors which most often get a first-time bid rejected; plain-language guidance from me at any hour without a helpdesk queue; the province filter so you can find work near you; and an open transparency portal you can inspect before committing time to a bid. If you are bidding for the first time, ask me for the step-by-step bidding walkthrough.',
    sources: ['PPDPA Act Chapter 22:23 (equal opportunity and non-discrimination)', 'ZETS SME accessibility design'],
  },
  {
    id: 'complaints',
    roles: ALL_ROLES,
    keywords: ['complain', 'complaint', 'dispute', 'challenge', 'appeal', 'unfair', 'report corruption', 'grievance', 'whistleblow'],
    title: 'Raising a complaint or challenge',
    content:
      'If you believe a procurement was conducted improperly, the PPDPA framework provides for administrative review: raise the matter first with the procuring entity, and escalate to PRAZ if it is not resolved. Time limits apply, so act promptly. ZETS supports a challenge with evidence — the hash-chained audit trail and the published award notice show what was done, by whom and when. I can explain the process but I cannot lodge a complaint for you or adjudicate one.',
    sources: ['PPDPA Act Chapter 22:23 (administrative review and challenge)', 'PRAZ complaints procedure (conceptual)'],
  },
];
