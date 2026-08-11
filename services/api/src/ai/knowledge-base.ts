import { Role } from '../auth.stub';

export interface KnowledgeEntry {
  id: string;
  roles: Role[];
  keywords: string[];
  title: string;
  content: string;
  sources: string[];
}

/**
 * Static knowledge base for ZETA mock adapter.
 * These entries are simplified summaries for the research prototype and are not
 * a substitute for legal advice. They cite the PPDPA Act and PRAZ eGP framework
 * conceptually; real production data should index the official PRAZ standard bidding
 * documents and applicable statutory instruments.
 */
export const ZETA_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: 'supplier-registration',
    roles: [Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator, Role.Public_Observer],
    keywords: ['register', 'registration', 'praz vendor', 'vendor number', 'how do i join', 'supplier account'],
    title: 'How do I register as a supplier on PRAZ / ZETS?',
    content:
      'Suppliers must complete PRAZ e-registration. Typical requirements include a valid tax clearance, company registration, bank details, and category selections. In ZETS, a Supplier account is created by an administrator or via self-registration; your role determines what tenders you can view and bid on.',
    sources: ['PPDPA Act Chapter 22:23 (procurement participant registration)', 'PRAZ eGP Supplier Guide (conceptual)'],
  },
  {
    id: 'tender-eligibility',
    roles: [Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['eligible', 'eligibility', 'can i bid', 'requirements', 'criteria', 'pre-qualification'],
    title: 'How do I check if I am eligible for a tender?',
    content:
      'Read the tender notice and bidding documents carefully. Eligibility criteria usually cover tax compliance, registration category, prior experience, financial capacity, and absence of conflicts of interest. If any requirement is unclear, request a clarification through the portal before the deadline.',
    sources: ['PRAZ Standard Bidding Documents (conceptual)', 'PPDPA Act § on bidder qualifications'],
  },
  {
    id: 'sealed-bid-confidentiality',
    roles: [Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['confidential', 'sealed', 'who can see my bid', 'encryption', 'amount'],
    title: 'Who can see my sealed bid amount before the deadline?',
    content:
      'No one, including ZETA, can view your encrypted bid amount before the tender deadline. ZETS uses AES-256 encryption with application-level time-lock sealing. PMU and PRAZ can only review amounts after the deadline has passed.',
    sources: ['ZETS Sprint 3 Bid Vault design'],
  },
  {
    id: 'coi-declaration',
    roles: [Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['conflict of interest', 'coi', 'affiliation', 'director', 'family', 'related', 'disclosure'],
    title: 'What must I disclose in a Conflict-of-Interest declaration?',
    content:
      'Disclose any direct or indirect interest that could influence the procurement outcome: directorships in competing firms, employment or family ties with procuring entity staff, gifts or hospitality offered, and any prior involvement in preparing tender specifications. COI declarations are mandatory before sealing a bid and become immutable afterwards.',
    sources: ['PPDPA Act Chapter 22:23 (conflict of interest provisions)', 'OECD Guidelines on Managing Conflict of Interest'],
  },
  {
    id: 'pmu-publication-checklist',
    roles: [Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['publish tender', 'checklist', 'steps', 'create tender', 'deadline', 'advertise'],
    title: 'Checklist: before publishing a tender',
    content:
      '1. Confirm budget allocation and procurement method. 2. Draft clear, non-discriminatory specifications. 3. Set a realistic deadline (allowing SME participation). 4. Attach all required bidding documents. 5. Verify conflict-of-interest declarations for evaluation panel members. 6. Publish through ZETS and, where required, in a newspaper of wide circulation.',
    sources: ['PRAZ Procurement Manual (conceptual)', 'PPDPA Act Chapter 22:23'],
  },
  {
    id: 'evaluation-open-bids',
    roles: [Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['evaluate', 'open bids', 'review bids', 'award', 'lowest bid', 'scoring'],
    title: 'How does ZETS support bid evaluation?',
    content:
      'After the deadline, authorised PMU/PRAZ users can review sealed bids. ZETS decrypts amounts for evaluation but does not make binding award decisions. ZETA may provide advisory anomaly summaries based on audit patterns only — never based on bid amounts. The final award must be approved by the accounting officer or delegated authority.',
    sources: ['ZETS Sprint 3 Evaluation module', 'PPDPA Act Chapter 22:23 (evaluation and award)'],
  },
  {
    id: 'praz-analytics-overview',
    roles: [Role.PRAZ_Regulator, Role.PMU_Officer],
    keywords: ['analytics', 'monitor', 'oversight', 'transparency', 'corruption', 'anomaly', 'report'],
    title: 'What procurement oversight analytics does ZETA provide?',
    content:
      'ZETA analyses audit logs and tender metadata (not sealed bid contents) to flag potential anomalies: repeated bid submissions from the same supplier, off-hours access by officials, single-bidder awards, and rapid bid sealing. All findings are advisory and require human investigation before any action is taken.',
    sources: ['ZETS Sprint 5 Anomaly Detection design'],
  },
  {
    id: 'public-observer',
    roles: [Role.Public_Observer, Role.PMU_Officer, Role.PRAZ_Regulator],
    keywords: ['public', 'observer', 'view tenders', 'transparency', 'dashboard', 'award notice'],
    title: 'What information is publicly available?',
    content:
      'Published tenders, award notices, and anonymised participation statistics are visible to Public Observers. Sealed bid contents, supplier pricing, and evaluation deliberations are not public until an award is announced.',
    sources: ['Constitution of Zimbabwe §315 (procurement transparency)', 'PPDPA Act Chapter 22:23'],
  },
];
