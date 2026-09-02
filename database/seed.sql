-- ============================================================
-- INTEL-X PORTAL — Seed Data
-- Run AFTER schema.sql in the Supabase SQL Editor.
-- ============================================================

-- -----------------------------------------------
-- AIRPORTS — 4 stations with real costs/domains
-- Briefing + evidence text are placeholder intel
-- copy matching each domain's narrative. Replace
-- with the real content from the 117-page doc
-- before the event.
-- -----------------------------------------------

INSERT INTO airports (code, name, domain, cost, briefing_text, evidence_content, fragment_name, q1_text, q2_text, q3_text) VALUES

('DXB', 'Dubai International', 'OPINT', 25,
  E'## OPERATIONS INTELLIGENCE BRIEFING — DUBAI (DXB)\n\n**Classification:** RESTRICTED — TASK FORCE EYES ONLY\n\n**Situation Overview:**\nAt 09:47 Z, Customs Enforcement flagged an anomaly in the cargo manifest system at Dubai International Airport. A shipment tagged **CRG-77-ECHO** was reclassified from "Standard Commercial Freight" to "Diplomatic Priority" using authorization code **BRX-419** — a code that should have been decommissioned six months ago.\n\nThe reclassification bypassed all standard screening protocols. The physical override was executed at the cargo processing terminal at approximately 10:20 Z, well before the legitimate system command was logged at 11:00 Z.\n\n**Key Questions:**\n- Who authorized the BRX-419 override?\n- Why does the physical timestamp precede the digital command?\n- What is the true nature of shipment CRG-77-ECHO?',

  E'### EVIDENCE PACKAGE — DXB/OPINT\n\n**Exhibit A: Cargo Manifest Exception Report**\nShipment CRG-77-ECHO — Original classification: Standard Commercial Freight (Weight: 350 kg, Origin: Undisclosed). Reclassified to Diplomatic Priority at 09:47 Z via override code BRX-419. Override station: Terminal 3, Cargo Bay 7.\n\n**Exhibit B: Ground Crew Log**\nEntry at 10:20 Z: "Priority cargo loaded to designated aircraft per special handling directive. No standard screening applied per diplomatic exemption." — Signed: Duty Supervisor K. Menon.\n\n**Exhibit C: System Audit Trail**\nBRX-419 was flagged for decommission on 2024-02-15. Last legitimate use: 2024-01-28 by Regional Customs Coordinator. Current use: unauthorized. No active personnel assignment found for this code.\n\n**Exhibit D: Aircraft Loading Record**\nFlight 88 (Tokyo) — unscheduled cargo addition of 350 kg loaded via priority override at Gate 14. Cargo bay seal replaced without standard chain-of-custody documentation.',

  'INT-FRAG-01: Operations Intelligence Fragment',
  'Who is the Duty Supervisor?',
  'What is the flight destination?',
  'What is the override code?'
),

('DOH', 'Doha Hamad International', 'CYBINT', 30,
  E'## CYBER INTELLIGENCE BRIEFING — DOHA (DOH)\n\n**Classification:** RESTRICTED — TASK FORCE EYES ONLY\n\n**Situation Overview:**\nNetwork monitoring at Doha Hamad International detected a device signature — MAC address **8A:4F:B2:99:XX** — appearing across three geographically separated access points within a 12-minute window. Standard physics makes this impossible for a single physical device.\n\nDeeper analysis reveals the signature belongs to a communications relay designated **NODE-01**, which replaced the previously destroyed physical command server **NODE 00**. Unlike its predecessor, NODE-01 is not a single machine — it is a distributed routing protocol running across multiple burner devices.\n\n**Key Questions:**\n- How is one MAC address appearing in multiple locations simultaneously?\n- What is the relationship between NODE 00 and NODE-01?\n- Who is operating the distributed relay network?',

  E'### EVIDENCE PACKAGE — DOH/CYBINT\n\n**Exhibit A: Network Access Point Logs**\nMAC 8A:4F:B2:99:XX detected at:\n- AP-Terminal-1: 10:03:22 Z\n- AP-Lounge-VIP: 10:08:45 Z\n- AP-Gate-East: 10:15:11 Z\nTravel time between Terminal 1 and Gate East: minimum 18 minutes on foot. Detection gap: 11 minutes 49 seconds.\n\n**Exhibit B: NODE 00 Incident Report**\nPhysical command server NODE 00 was identified and destroyed during a prior operation. It served as the hub in a hub-and-spoke communication architecture coordinating four ground operatives. Its destruction severed all command channels.\n\n**Exhibit C: NODE-01 Analysis**\nPost-NODE 00 destruction, a new routing methodology emerged. Designated NODE-01, it is NOT a physical server but a distributed protocol. The same MAC signature is cloned/spoofed across multiple burner devices, creating the appearance of a single mobile device.\n\n**Exhibit D: Device Forensics Fragment**\nBurner device recovered near Gate East. Factory reset, no user data. MAC address manually set to 8A:4F:B2:99:XX. Firmware modified to relay encrypted packets to a rotating set of endpoints.',

  'INT-FRAG-02: Cyber Intelligence Fragment',
  'What is the MAC prefix?',
  'What is the new node protocol?',
  'Where was the device recovered?'
),

('SIN', 'Singapore Changi', 'FININT', 25,
  E'## FINANCIAL INTELLIGENCE BRIEFING — SINGAPORE (SIN)\n\n**Classification:** RESTRICTED — TASK FORCE EYES ONLY\n\n**Situation Overview:**\nFinancial monitoring systems at Singapore Changi flagged a series of micro-transactions routing through identifier **SWIFT-TANGO-09**. A $2.5 million escrow transfer was frozen by automated compliance checks at approximately 11:30 Z — but by that time, the funds had already been moved through an alternative channel.\n\nInstead of a single large transfer, the operation used "smurfing" — breaking the sum into hundreds of sub-threshold micro-transfers that individually fall below reporting limits. The routing identifier SWIFT-TANGO-09 appears across all fragments.\n\n**Key Questions:**\n- Why was the escrow frozen, and how were funds moved despite the freeze?\n- What is the pattern behind the micro-transfer routing?\n- Who controls SWIFT-TANGO-09?',

  E'### EVIDENCE PACKAGE — SIN/FININT\n\n**Exhibit A: Escrow Freeze Notification**\nAt 11:30 Z, automated compliance systems froze escrow account linked to SWIFT-TANGO-09. Reason: pattern anomaly — 247 sub-threshold transfers detected in a 4-hour window, aggregating to approximately $2.5M USD.\n\n**Exhibit B: Micro-Transfer Pattern Analysis**\nTransfer amounts range from $1,200 to $9,800 (all below the $10,000 reporting threshold). Each routed through a different intermediary bank. Final destination accounts are shell entities registered across 6 jurisdictions.\n\n**Exhibit C: Temporal Correlation**\nThe 11:30 Z freeze timestamp is significant: Subject Alpha departed on Flight 112 (London) at 11:15 Z — 15 minutes before the financial clearing event. Subject Beta remained in the terminal past 11:30 Z.\n\n**Exhibit D: Routing Identifier Trace**\nSWIFT-TANGO-09 links to a corporate entity: "Meridian Transit Solutions" — registered 2019, minimal public footprint, listed director name does not match any known operative.',

  'INT-FRAG-03: Financial Intelligence Fragment',
  'What is the SWIFT identifier?',
  'How many micro-transfers?',
  'What is the company name?'
),

('DEL', 'Delhi Indira Gandhi International', 'HUMINT', 25,
  E'## HUMAN INTELLIGENCE BRIEFING — DELHI (DEL)\n\n**Classification:** RESTRICTED — TASK FORCE EYES ONLY\n\n**Situation Overview:**\nGround assets at Delhi IGI Airport have identified two persons of interest observed in the international departure terminal. Both were flagged by behavioral analysis systems, but their profiles diverge sharply.\n\n**Subject Alpha** — visibly agitated, wearing a red jacket, observed making rapid phone calls and checking departure boards repeatedly. Boarded Flight 112 to London at 11:15 Z. Authorization code **BRX-419** was found in paperwork near his last known position.\n\n**Subject Beta** — calm, measured demeanor. Minimal digital footprint in the terminal. Boarded Flight 88 to Tokyo. Dropped documentation containing BRX-419 references near the gate.\n\n**Key Questions:**\n- Which subject, if either, is connected to the smuggling operation?\n- Why did Alpha depart before the 11:30 Z financial event?\n- What does Beta''s calm profile suggest about their role?',

  E'### EVIDENCE PACKAGE — DEL/HUMINT\n\n**Exhibit A: Behavioral Surveillance Report**\nSubject Alpha: Male, red jacket, heavy carry-on. Observed pacing near Gate 22 from 10:30–11:10 Z. Made 7 phone calls in 40 minutes. Visibly distressed. Boarded Flight 112 (London) at 11:15 Z. No checked luggage.\n\nSubject Beta: Male, dark clothing, single laptop bag. Observed seated near Gate 14 from 10:00–11:40 Z. Made zero phone calls. Read a newspaper. Boarded Flight 88 (Tokyo) at 11:45 Z.\n\n**Exhibit B: Recovered Documentation**\nNear Gate 14 (Beta''s location): A folded customs form bearing authorization code BRX-419 and handwritten cargo reference "CRG-77-ECHO." Form is unsigned.\n\n**Exhibit C: Witness Statement**\nAirport security officer: "The man in the red jacket looked like he was about to miss his flight — panicking, sweating. The other one by Gate 14 barely moved for over an hour. Very composed."\n\n**Exhibit D: Timing Analysis**\nAlpha departed at 11:15 Z. The financial freeze occurred at 11:30 Z. If Alpha were the operation controller, he would need to be present for the financial clearing — his early departure suggests he is NOT the primary target.\n\nBeta remained in the terminal through 11:30 Z and beyond, consistent with someone who needed to confirm the financial operation completed before departing.',

  'INT-FRAG-04: Human Intelligence Fragment',
  'What color is Alphas jacket?',
  'What flight did Beta take?',
  'Who was distressed?'
)
ON CONFLICT (code) DO UPDATE SET
  q1_text = EXCLUDED.q1_text,
  q2_text = EXCLUDED.q2_text,
  q3_text = EXCLUDED.q3_text;

-- -----------------------------------------------
-- AIRPORT ANSWER KEYS (Admin only)
-- -----------------------------------------------
INSERT INTO airport_answer_keys (airport_id, q1_answer, q2_answer, q3_answer)
SELECT id, 'menon', 'tokyo', 'brx-419' FROM airports WHERE code = 'DXB'
ON CONFLICT (airport_id) DO UPDATE SET q1_answer = EXCLUDED.q1_answer, q2_answer = EXCLUDED.q2_answer, q3_answer = EXCLUDED.q3_answer;

INSERT INTO airport_answer_keys (airport_id, q1_answer, q2_answer, q3_answer)
SELECT id, '8a', 'node-01', 'gate' FROM airports WHERE code = 'DOH'
ON CONFLICT (airport_id) DO UPDATE SET q1_answer = EXCLUDED.q1_answer, q2_answer = EXCLUDED.q2_answer, q3_answer = EXCLUDED.q3_answer;

INSERT INTO airport_answer_keys (airport_id, q1_answer, q2_answer, q3_answer)
SELECT id, 'tango', '247', 'meridian' FROM airports WHERE code = 'SIN'
ON CONFLICT (airport_id) DO UPDATE SET q1_answer = EXCLUDED.q1_answer, q2_answer = EXCLUDED.q2_answer, q3_answer = EXCLUDED.q3_answer;

INSERT INTO airport_answer_keys (airport_id, q1_answer, q2_answer, q3_answer)
SELECT id, 'red', '88', 'alpha' FROM airports WHERE code = 'DEL'
ON CONFLICT (airport_id) DO UPDATE SET q1_answer = EXCLUDED.q1_answer, q2_answer = EXCLUDED.q2_answer, q3_answer = EXCLUDED.q3_answer;


-- -----------------------------------------------
-- AUCTION ITEMS — 4 classified asset packages
-- Public teasers are from the source doc.
-- Hidden content is the actual intelligence reveal.
-- Replace with real content before the event.
-- -----------------------------------------------

INSERT INTO auction_items (name, public_teaser, hidden_content, category_note) VALUES

('ASSET 07: MAC Duplication Log',
  'Global network monitoring sweep — device signature analysis across multiple international transit hubs.',
  E'## CLASSIFIED — MAC DUPLICATION LOG\n\n**Intelligence Grade:** CRITICAL\n\nGlobal network monitoring has confirmed that MAC address 8A:4F:B2:99:XX is being actively cloned across a distributed device network. The signature is not one device traveling — it is one identity replicated across multiple burner relay stations.\n\nThis resolves the "impossible timeline" paradox: the MAC appearing at three access points within 12 minutes is physically impossible for a single device. It is, however, entirely consistent with a spoofed signature distributed across NODE-01''s relay architecture.\n\n**Operational Significance:** This confirms NODE-01 is a distributed protocol, not a physical server. The controller is using MAC spoofing to create the illusion of a single mobile command node while actually operating through disposable relays.',
  'CRITICAL — Solves the impossible-timeline paradox'
),

('ASSET 04: Flight 88 Ground Log',
  'Tarmac operations report for the Tokyo departure — ground crew documentation and cargo handling records.',
  E'## CLASSIFIED — FLIGHT 88 GROUND LOG\n\n**Intelligence Grade:** STRONG\n\nTarmac operations report confirms an unscheduled cargo addition of 350 kg was loaded onto Flight 88 (Tokyo) via a priority override at Gate 14. The cargo was processed under diplomatic exemption using authorization code BRX-419.\n\nThe loading record ties Delhi''s cargo operation directly to Dubai''s cargo manifest exception — the same BRX-419 code, the same CRG-77-ECHO shipment tag, routed through the same priority channel.\n\n**Chain of Evidence:**\nDubai cargo reclassification (09:47 Z) → Physical override at Delhi (10:20 Z) → Loading onto Flight 88 at Gate 14 → Subject Beta boards Flight 88 at Gate 14.\n\nThis places Beta at the same gate where the unauthorized cargo was loaded, on the same flight carrying the smuggled shipment.',
  'STRONG — Links Delhi cargo to Dubai manifest'
),

('ASSET 03: The Escrow Bypass',
  'Analyst whitepaper on banking failsafes — technical overview of financial compliance circumvention methods.',
  E'## CLASSIFIED — THE ESCROW BYPASS\n\n**Intelligence Grade:** SUPPLEMENTARY\n\nTechnical analysis of the "smurfing" technique used to bypass the $2.5M escrow freeze:\n\nWhen the primary escrow account was frozen at 11:30 Z, the operation had already distributed the full amount through 247 micro-transfers, each below the $10,000 automated reporting threshold. The transfers were routed through SWIFT-TANGO-09 across intermediary banks in 6 jurisdictions.\n\n**Assessment:** This confirms the financial methodology but does not reveal anything that a careful analysis of the Singapore FININT evidence shouldn''t already have surfaced. Teams that deduced the smurfing pattern from the SIN dossier already possess this intelligence.\n\n⚠️ **Risk Note:** This asset confirms an existing deduction rather than providing new intelligence. Credits spent here may have been better allocated elsewhere.',
  'RISK — Confirms existing deduction; potential credit trap'
),

('ASSET 10: Honeypot Mechanics',
  'CYBINT analysis of deception commands — investigation into network misdirection and false-flag operations.',
  E'## CLASSIFIED — HONEYPOT MECHANICS\n\n**Intelligence Grade:** SUPPLEMENTARY\n\nAnalysis of deception commands within the NODE-01 relay network reveals a honeypot architecture: some relay nodes are intentionally configured to appear as the command origin, drawing investigation resources toward decoy endpoints while the actual command traffic routes through a separate channel.\n\n**Assessment:** This confirms the existence of deliberate misdirection within the network but does not identify the actual controller or provide new actionable intelligence. Teams already aware of the hub-and-spoke / relay architecture gain minimal advantage.\n\n⚠️ **Risk Note:** This asset validates jargon-heavy technical details that sound impressive but don''t advance the core investigation. Teams overvaluing technical complexity over actionable intelligence may find this a poor investment.',
  'RISK — Confirms existing deduction; trap for jargon-seekers'
);


-- -----------------------------------------------
-- GAME STATE — single row, starts at not_started
-- -----------------------------------------------

INSERT INTO game_state (current_phase, phase_started_at, informer_stall_active, informer_stall_cost, informer_stall_content)
VALUES ('not_started', now(), false, 10, '');

-- -----------------------------------------------
-- TEAMS — Test data for local development
-- -----------------------------------------------
INSERT INTO teams (name, login_code, team_password, credits_balance, clearance_tier) VALUES
('Alpha Squad', 'TEST-ALPHA-123', 'alpha2026', 60, 'ALPHA'),
('Bravo Six', 'TEST-BRAVO-456', 'bravo2026', 45, 'BRAVO'),
('Charlie Team', 'TEST-CHARLIE-789', 'charlie2026', 35, 'CHARLIE'),
('Delta Force', 'TEST-DELTA-000', 'delta2026', 0, NULL);
