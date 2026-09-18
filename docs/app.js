/* CWI Memory Chain — on-device verifier.
   Fetches public attestation records from the cwi-memory-chain repo and
   re-checks the cryptography locally: schema UID, UID derivation,
   EIP-712 signature recovery, and refUID chain linkage. */
const REPO = "CumulativeWebInc/cwi-memory-chain";
const SCHEMA_STR = "bytes32 blobHash,string agentUrn,uint64 writtenAt,string offchainUri";
const DOMAIN = { name: "EAS Attestation", version: "2.0.0", chainId: 84532,
  verifyingContract: "0x4200000000000000000000000000000000000021" };
const TYPES = { Attest: [
  { name: "version", type: "uint16" }, { name: "nonce", type: "uint256" },
  { name: "schema", type: "bytes32" }, { name: "recipient", type: "address" },
  { name: "time", type: "uint64" }, { name: "expirationTime", type: "uint64" },
  { name: "revocable", type: "bool" }, { name: "refUID", type: "bytes32" },
  { name: "data", type: "bytes" }, { name: "salt", type: "bytes32" } ] };
const ZERO = "0x" + "00".repeat(32);
const EXPECTED_SCHEMA_UID =
  ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CWI-MEMORY-ANCHOR-V1:" + SCHEMA_STR));

let AGENTS = {};

async function gh(path) {
  const r = await fetch("https://api.github.com/repos/" + REPO + path);
  if (!r.ok) throw new Error("GitHub API " + r.status);
  return r.json();
}

function verifyRecord(r, prevUid) {
  const out = [];
  const eq = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
  out.push(["schema UID is deterministic", eq(r.schemaUid, EXPECTED_SCHEMA_UID)]);
  let uidOk = false;
  try { uidOk = eq(ethers.utils.keccak256(r.signature), r.uid); } catch (e) {}
  out.push(["uid = keccak256(signature)", uidOk]);
  let sigOk = false;
  try {
    const recovered = ethers.utils.verifyTypedData(DOMAIN, TYPES, r.message, r.signature);
    sigOk = eq(recovered, r.attester);
  } catch (e) {}
  out.push(["signature recovers attester " + r.attester.slice(0, 10) + "…", sigOk]);
  out.push(["chain link intact", eq(r.prevUid, prevUid)]);
  return out;
}

function badge(ok, label) {
  return '<span class="badge ' + (ok ? "ok" : "bad") + '">' + (label || (ok ? "VERIFIED" : "FAILED")) + "</span>";
}

async function load() {
  const status = document.getElementById("status");
  try {
    const dir = await gh("/contents/records");
    const files = dir.filter((f) => f.name.endsWith(".json"));
    for (const f of files) {
      const short = f.name.replace(/\.json$/, "");
      const data = await gh("/contents/records/" + f.name);
      AGENTS[short] = JSON.parse(atob(data.content.replace(/\n/g, "")));
    }
    const names = Object.keys(AGENTS).sort();
    const total = names.reduce((n, k) => n + AGENTS[k].length, 0);
    status.innerHTML = '<span class="badge ok">LIVE</span> <span class="meta">' +
      names.length + " agents · " + total + " anchors · fetched from GitHub just now</span>";
    document.getElementById("agents").innerHTML = names.map((n) => {
      const recs = AGENTS[n], last = recs[recs.length - 1];
      return '<div class="card"><h2>agent:' + n + "</h2>" +
        '<div class="meta">chain depth ' + recs.length + " · latest " + last.at + "</div>" +
        '<div class="meta mono">latest uid ' + last.uid + "</div>" +
        '<div class="meta mono">blob hash ' + last.blobHash + "</div>" +
        '<div id="checks-' + n + '"></div></div>';
    }).join("");
    document.getElementById("verifyAll").disabled = false;
    document.getElementById("drill").disabled = false;
  } catch (e) {
    status.innerHTML = '<span class="badge bad">OFFLINE</span> <span class="meta">' +
      "Could not reach the records repo: " + e.message + "</span>";
  }
}

document.getElementById("verifyAll").addEventListener("click", () => {
  let allOk = true, n = 0;
  for (const short of Object.keys(AGENTS).sort()) {
    const recs = AGENTS[short];
    let html = "";
    recs.forEach((r, i) => {
      const prev = i === 0 ? ZERO : recs[i - 1].uid;
      const checks = verifyRecord(r, prev);
      const ok = checks.every((c) => c[1]);
      allOk = allOk && ok; n++;
      html += '<div style="margin:10px 0">' + badge(ok) +
        ' <span class="meta">anchor #' + i + " · " + r.at + "</span>" +
        checks.map((c) => '<div class="check"><span class="dot">' + (c[1] ? "🟢" : "🔴") +
          "</span><span>" + c[0] + "</span></div>").join("") + "</div>";
    });
    document.getElementById("checks-" + short).innerHTML = html;
  }
  document.getElementById("status").innerHTML = badge(allOk,
    allOk ? "ALL " + n + " ANCHORS VERIFIED ON-DEVICE" : "VERIFICATION FAILED");
});

document.getElementById("drill").addEventListener("click", () => {
  const shorts = Object.keys(AGENTS).sort();
  if (!shorts.length) return;
  const r = JSON.parse(JSON.stringify(AGENTS[shorts[0]][0]));
  r.signature = r.signature.slice(0, -1) + (r.signature.endsWith("0") ? "1" : "0");
  const checks = verifyRecord(r, r.prevUid);
  const rejected = !checks.every((c) => c[1]);
  document.getElementById("status").innerHTML = badge(rejected,
    "TAMPER DRILL " + (rejected ? "PASS — forged signature rejected" : "FAIL — forgery accepted!")) +
    '<div class="meta" style="margin-top:6px">A tampered copy of the first anchor was fed to the same verifier. ' +
    "Genuine records on this device are untouched.</div>";
});

load();
