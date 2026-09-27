# conformly

[![npm version](https://img.shields.io/npm/v/conformly.svg)](https://www.npmjs.com/package/conformly)
[![license](https://img.shields.io/npm/l/conformly.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/conformly.svg)](https://nodejs.org)

Free **RGAA / WCAG** web accessibility scanner for your **CLI & CI** — check any URL in one
command, no account required. Powered by the public [Conformly](https://conformly.online)
free-scan API (real-browser render, so React/Vue/Angular apps are analysed properly).

> Scanner d'accessibilité **RGAA / WCAG** en ligne de commande & CI, sans compte.

## Usage

```bash
npx conformly scan https://your-site.com
# → Score RGAA : 96 %  ·  1 anomalie(s)
```

```bash
# Fail the build (exit 1) below a score threshold
npx conformly scan https://your-site.com --threshold 90

# Raw JSON output
npx conformly scan https://your-site.com --json
```

## GitHub Action

```yaml
- name: Accessibility check
  uses: SeifBouarada/conformly-cli@v1
  with:
    url: https://your-site.com
    threshold: 90   # optional: fail the job below this RGAA score
```

The step fails when the score is below `threshold`, just like a broken test, and writes the
score to the job summary. Leave `threshold` empty to report without failing.

| Input | Required | Description |
|---|---|---|
| `url` | yes | Public URL to scan. |
| `threshold` | no | Minimum RGAA score (0–100). Empty = report only. |

| Output | Description |
|---|---|
| `score` | RGAA score (0–100) on the automatable criteria. |
| `anomalies` | Number of anomalies found (one per affected element). |

```yaml
- id: a11y
  uses: SeifBouarada/conformly-cli@v1
  with:
    url: ${{ steps.deploy.outputs.preview-url }}
- run: echo "Accessibility score: ${{ steps.a11y.outputs.score }} %"
```

The action runs the CLI shipped in the tagged release (Node, preinstalled on GitHub-hosted
runners): nothing is downloaded at run time.

### Other CI (GitLab, CircleCI…)

```yaml
- npx conformly scan https://your-site.com --threshold 90
```

Exit code `1` when the score is below the threshold → your pipeline fails.

## Options

| Option | Effet |
|---|---|
| `--threshold N` | Sort en erreur (exit 1) si le score est sous `N` (0–100). |
| `--json` | Sortie JSON brute (`{ url, score, anomalies, threshold }`). |

## Configuration

| Variable | Défaut | Rôle |
|---|---|---|
| `CONFORMLY_URL` | `https://conformly.online` | Base de l'API. |

## What it checks — and what it doesn't

The scan combines **axe-core** with **expert tests** (page language, title, skip link,
visible focus, 200% zoom…) and maps findings to RGAA criteria.

**Honest scope:** automated testing only covers **part** of WCAG/RGAA. A full accessibility
declaration still requires human review of the non-automatable criteria. Treat the score as
a fast, reliable signal and a between-audits safety net — **not** a certification.

## Continuous monitoring

A CI check is a floor. For drift over time — regression alerts on every deploy, per-page
history, timestamped evidence, per-framework fix guides — create a free account at
**[conformly.online](https://conformly.online)**.

## License

[MIT](./LICENSE) — © Conformly · [conformly.online](https://conformly.online)
