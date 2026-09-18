# Twenty Minds — iOS app for the memory chain (2026-09-18)

Decision: Ship the iOS memory-chain app as a PWA backed by a new PUBLIC repo
holding only the plaintext attestation records (hashes/signatures/timestamps),
instead of (a) a native App Store app, or (b) a PWA gated on the private repo?

Facts:
1. Black asked for a downloadable iOS app with icon for the memory blockchain layer.
2. $0 paths first; App Store needs $99/yr + review + weeks; PWA installs from Safari in seconds with a home-screen icon.
3. Memory bodies are AES-256 encrypted in a private repo; attestation records contain only hashes, signatures, timestamps, agent names — no fact content, no secrets.
4. Kill gate 3 (by Oct 9) needs an external party to independently verify an anchor without CWI help — a public records feed directly serves this.
5. On-device full verification is possible for signatures/UIDs/hashes, but not blob decryption (passphrase never leaves the vault) — the phone proves the chain is intact but can't read memory contents.

## Verdicts
1. Skeptic — Ship the PWA + public records repo; the "risk" of publishing hashes is theater — salted SHA-256 of AES-256 ciphertext reveals nothing, and secrecy was never the security property. Risk: if the salt scheme ever weakens, published hashes become a retroactive liability.
2. Data scientist — Ship it; the measurable outcome is install time (seconds via Safari vs weeks via App Store review) and gate-3 verifiability (external verifier needs zero credentials). Risk: we have no data on whether Black will actually install a PWA vs expecting an App Store icon.
3. User advocate — Ship it; Black asked for "downloadable app with icon" and a home-screen PWA icon is exactly what his thumb expects, today not next month. Risk: iOS PWAs can't do push notifications — if he later expects alerts on new anchors, the PWA will feel broken.
4. Contrarian — Don't build an app at all; the chain layer already has a CLI and a test suite, and a phone dashboard for 2 anchored agents is a toy that invites scope creep. Risk: refusing a direct, cheap request from Black burns more trust than a small build costs.
5. Engineer — Ship it; a static PWA reading public JSON via the GitHub API is trivially buildable, debuggable, and cacheable, with zero backend to maintain. Risk: the public mirror repo is a second source of truth — every anchor must write to both repos or the phone shows stale chain state. (Answered: mirror write is now inside the anchor command itself.)
6. Economist — Ship it; $0 marginal cost, and the public records repo doubles as the gate-3 external-verification artifact — one build pays two kill gates. Risk: maintaining two repos doubles the write-path complexity forever.
7. Security reviewer — Ship it, but the threat model must be explicit: records are public-by-design, bodies stay encrypted in the private repo, and the PWA must never accept a pasted passphrase or private key. Risk: a future "verify my memories" feature request could tempt someone to add decryption to the phone — that door stays nailed shut.
8. Child-of-five explainer — Ship it: "the phone shows the unbreakable list, but only the vault can read the secrets" is a sentence anyone gets. Risk: simple stories hide the mirror-repo sync detail, which is where it will actually break.
9. 10-year historian — Ship it; in 2036 the record shows CWI put its trust receipts where strangers could check them — public verifiability is the whole point of a chain. Risk: historians also record the repos we abandoned — a stale public mirror would read as a dead promise.
10. Devil's accountant — Ship it; true cost is one repo + one Pages site + a mirror-write step per anchor, roughly an hour today and minutes per anchor after. Risk: the compounding cost is every future anchor tool change having to update two write paths — budget for that now.
11. Field operator — Ship it; my worst Tuesday is an anchor that wrote to the private repo but not the public mirror, and Black's phone showing yesterday's chain — the fix is making the mirror write part of the anchor command itself, not a separate step. Risk: if the mirror write fails silently, nobody notices until Black does.
12. Systems thinker — Ship it; the public records feed creates a positive loop — external verifiers (gate 3) can build on it, which pressures us to keep anchors honest. Risk: it also creates a dependency loop — the PWA, the mirror, and the anchor CLI must version together or drift apart.
13. Risk underwriter — Ship it; tail risk is low — worst case is a public repo of useless hashes if we kill the chain layer, which costs nothing and exposes nothing. Risk: the exposed tail is reputational — publishing "tamper-proof memory" invites adversarial scrutiny we must survive.
14. Open-source maintainer — Ship it; strangers must be able to read the records, fork the verifier, and trust the chain without asking us anything — public repo + static PWA is exactly that shape. Risk: the verifier JS must be readable, not minified into obscurity, or the trust claim is hollow.
15. Negotiator — Ship it; our walk-away is the CLI + test suite we already have — the PWA adds convenience, not capability, so we never over-promise what the phone proves. Risk: Black may read "app" as "full memory access on my phone" — the walk-away must be stated in the handoff, not discovered later.
16. Time traveler (2036) — Ship it; looking back, the PWA was the artifact that made the chain layer real to a human — CLIs don't get independently verified, home-screen apps do. Risk: the traveler also remembers every PWA that rotted when its builder stopped updating the mirror.
17. First-principles physicist — Ship it; what must be true: (a) iOS installs PWAs from Safari with zero gatekeepers, (b) hashes of ciphertext are not secrets, (c) verification math runs in any JS engine — everything else is preference. Risk: (c) needs a real ECDSA recovery lib on-device — vendored ethers 5.7 UMD covers it.
18. Ethicist — Ship it; no one is harmed — no personal data, no memory contents, no credentials touch the public surface; the only consent needed is Black's, and he asked. Risk: agent URNs in public records name our agents — trivial, but logged honestly.
19. Competitor analyst — Ship it; the strongest competitor would keep their chain private and ask for trust — publishing the records is the move they can't dismiss without looking closed. Risk: they can fork our records format in an afternoon — the moat is the encrypted bodies + live anchoring cadence, not the PWA.
20. Black's chair — Ship it; $0 path first, results today not next quarter, verify-before-asserting (the PWA re-verifies on-device), and never ship a simulation — the phone must show live chain state or nothing. Risk: his "downloadable app" might mean App Store in his head — show him the home-screen icon first and let the thumb decide.

## Synthesis
- Decision: Ship the PWA backed by a new public repo holding only plaintext attestation records.
- Why: Black's chair ($0, today, real data), the engineer (trivially maintainable static build), and the open-source maintainer (strangers must verify without us — gate 3) converged.
- Dissent recorded: the contrarian's minority — a phone dashboard for 2 anchored agents risks being a toy; the PWA must show live data and grow with the anchor cadence, or it gets killed with the chain layer on Oct 9.
- Confidence: high — fact that would change it: if Apple blocked PWA installation or GitHub API reads from mobile Safari, flip to a different shell.
- Changed the pre-run lean? no — the lean was already PWA + public records. (First no-change run on this decision stream.)
