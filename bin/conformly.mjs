#!/usr/bin/env node
// Epic 15.4 — CLI de scan d'accessibilité RGAA. Utilise l'API publique du scan gratuit
// de Conformly (aucun token requis). Idéal en CI : `--threshold` fait échouer le build
// sous le score visé.
//
// Usage :
//   npx conformly scan <url> [--threshold <0-100>] [--json]
//
// Variables : CONFORMLY_URL (défaut https://conformly.online).

const API = (process.env.CONFORMLY_URL || "https://conformly.online").replace(/\/$/, "");
const POLL_MS = 2500;
const MAX_POLLS = 60;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function usage(code) {
  console.error(
    [
      "conformly — scan d'accessibilité RGAA",
      "",
      "Usage :",
      "  conformly scan <url> [--threshold <0-100>] [--json]",
      "",
      "Options :",
      "  --threshold N  Échoue (exit 1) si le score est sous N.",
      "  --json         Sortie JSON brute.",
    ].join("\n"),
  );
  process.exit(code);
}

function parseArgs(argv) {
  if (argv[0] !== "scan" || !argv[1] || argv[1].startsWith("-")) usage(2);
  const url = argv[1];
  let threshold = null;
  let json = false;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--threshold") threshold = Number(argv[++i]);
    else if (argv[i] === "--json") json = true;
    else usage(2);
  }
  if (threshold !== null && (Number.isNaN(threshold) || threshold < 0 || threshold > 100)) usage(2);
  return { url, threshold, json };
}

function anomalyCount(violations) {
  if (!Array.isArray(violations)) return 0;
  let n = 0;
  for (const v of violations) {
    if (!v || typeof v.ruleId !== "string") continue;
    n += Array.isArray(v.nodes) ? v.nodes.length : 1;
  }
  return n;
}

async function main() {
  const { url, threshold, json } = parseArgs(process.argv.slice(2));

  let started;
  try {
    const res = await fetch(`${API}/api/free-scan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    started = await res.json();
    if (!res.ok || !started.id) {
      console.error(`Erreur : ${started.error || res.status}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`Erreur réseau : ${err.message}`);
    process.exit(1);
  }

  if (!json) process.stderr.write(`Scan de ${url} en cours…\n`);

  let result = null;
  for (let i = 0; i < MAX_POLLS; i++) {
    await sleep(POLL_MS);
    try {
      const r = await fetch(`${API}/api/free-scan/${started.id}`);
      const data = await r.json();
      if (data.status === "done" || data.status === "error") {
        result = data;
        break;
      }
    } catch {
      /* on retente */
    }
  }

  if (!result) {
    console.error("Délai dépassé.");
    process.exit(1);
  }
  if (result.status === "error") {
    console.error(`Analyse impossible : ${result.errorReason || "erreur inconnue"}`);
    process.exit(1);
  }

  const score = result.score != null ? Math.round(result.score) : null;
  const anomalies = anomalyCount(result.violations);

  if (json) {
    console.log(JSON.stringify({ url, score, anomalies, threshold }, null, 2));
  } else {
    console.log(`Score RGAA : ${score != null ? score + " %" : "—"}  ·  ${anomalies} anomalie(s)`);
  }

  if (threshold !== null && score != null && score < threshold) {
    console.error(`Score ${score}% sous le seuil ${threshold}%.`);
    process.exit(1);
  }
  process.exit(0);
}

main();
