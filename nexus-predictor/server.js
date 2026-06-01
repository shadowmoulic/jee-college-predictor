"use strict";

/**
 * Nexus College Predictor — Express API Server
 * =============================================
 * POST /api/predict  →  spawns predictor.py via child_process.spawn,
 *                        passes validated JSON over stdin, returns:
 *                        { success, data, visualization, meta }
 */

const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

// ── Configuration ─────────────────────────────────────────────────────────────

const PORT        = parseInt(process.env.PORT || "4000", 10);
const SCRIPT_PATH = path.join(__dirname, "predictor.py");

// Prefer the local venv python (created by `python3 -m venv .venv`),
// then the PYTHON_BIN env var, then fall back to the system python3.
const VENV_PYTHON = path.join(__dirname, "..", ".venv", "bin", "python3");
const PYTHON_BIN  = (() => {
  try { require("fs").accessSync(VENV_PYTHON); return VENV_PYTHON; } catch { /* no venv */ }
  return process.env.PYTHON_BIN || "python3";
})();
const DEFAULT_CSV = path.join(__dirname, "data", "josaa_cutoffs.csv");

/** Maximum time (ms) we wait for the Python process before killing it. */
const PYTHON_TIMEOUT_MS = parseInt(process.env.PYTHON_TIMEOUT_MS || "30000", 10);

// ── Express app ───────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: "1mb" }));

// Allow simple cross-origin requests from frontend dev servers
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate and coerce the request body.
 * Returns { rank, category, seatType, csvPath, errors[] }.
 */
function validateBody(body) {
  const errors = [];

  const rank = parseInt(body.rank, 10);
  if (!body.rank || isNaN(rank) || rank <= 0) {
    errors.push("'rank' must be a positive integer.");
  }

  if (!body.category || typeof body.category !== "string" || !body.category.trim()) {
    errors.push("'category' must be a non-empty string.");
  }

  if (!body.seatType || typeof body.seatType !== "string" || !body.seatType.trim()) {
    errors.push("'seatType' must be a non-empty string.");
  }

  // year defaults to 2025 (latest JoSAA data); caller may override
  const year = body.year ? parseInt(body.year, 10) : 2025;
  if (body.year && (isNaN(year) || year < 2020 || year > 2030)) {
    errors.push("'year' must be a valid JoSAA year (2020–2030).");
  }

  const csvPath =
    body.csvPath && typeof body.csvPath === "string" && body.csvPath.trim()
      ? body.csvPath.trim()
      : DEFAULT_CSV;

  return {
    rank,
    category: typeof body.category === "string" ? body.category.trim() : "",
    seatType:  typeof body.seatType  === "string" ? body.seatType.trim()  : "",
    year,
    csvPath,
    errors,
  };
}

// ── Python runner ─────────────────────────────────────────────────────────────

/**
 * Spawn predictor.py, pipe `payload` to stdin, collect stdout/stderr.
 * Resolves with { exitCode, stdout, stderr }.
 * Rejects only on spawn-level errors (binary not found, etc.).
 */
function runPredictor(payload) {
  return new Promise((resolve, reject) => {
    const py = spawn(PYTHON_BIN, [SCRIPT_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const stdoutChunks = [];
    const stderrChunks = [];

    py.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    py.stderr.on("data", (chunk) => stderrChunks.push(chunk));

    // Kill if it takes too long
    const timer = setTimeout(() => {
      py.kill("SIGTERM");
      stderrChunks.push(Buffer.from(`TIMEOUT: process killed after ${PYTHON_TIMEOUT_MS}ms`));
    }, PYTHON_TIMEOUT_MS);

    py.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    py.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({
        exitCode,
        stdout: Buffer.concat(stdoutChunks).toString("utf8").trim(),
        stderr: Buffer.concat(stderrChunks).toString("utf8").trim(),
      });
    });

    // Write payload and close stdin so Python's sys.stdin.read() unblocks
    py.stdin.write(payload, "utf8");
    py.stdin.end();
  });
}

// ── Route: POST /api/predict ──────────────────────────────────────────────────

app.post("/api/predict", async (req, res) => {
  // 1. Validate input
  const { rank, category, seatType, year, csvPath, errors } = validateBody(req.body);
  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  // 2. Build the payload that will be piped to Python via stdin
  const payload = JSON.stringify({ rank, category, seatType, year, csvPath });

  // 3. Spawn Python and await completion
  let result;
  try {
    result = await runPredictor(payload);
  } catch (spawnErr) {
    console.error("[nexus] spawn error:", spawnErr);
    return res.status(500).json({
      success: false,
      error: "Failed to start the prediction engine. Ensure Python 3 is installed.",
      details: spawnErr.message,
    });
  }

  const { exitCode, stdout, stderr } = result;

  // 4. Non-zero exit → something went wrong inside Python
  if (exitCode !== 0) {
    console.error(`[nexus] predictor.py exited ${exitCode}:\n${stderr}`);
    return res.status(500).json({
      success: false,
      error: "Prediction engine encountered an error.",
      // Expose the Python error message (stderr) so the caller can debug
      details: stderr || `Process exited with code ${exitCode}`,
    });
  }

  // 5. Parse the JSON payload that Python printed to stdout
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (parseErr) {
    console.error("[nexus] JSON parse error:", parseErr.message);
    console.error("[nexus] Raw stdout (first 400 chars):", stdout.slice(0, 400));
    return res.status(500).json({
      success: false,
      error: "Prediction engine returned malformed JSON output.",
      details: stdout.slice(0, 200),
    });
  }

  // 6. Return the clean 200 response
  return res.status(200).json({
    success: true,
    data:          parsed.data          ?? [],
    visualization: parsed.visualization ?? null,
    summary:       parsed.summary       ?? { High: 0, Moderate: 0, Low: 0 },
    meta:          parsed.meta          ?? { rank, category, seatType, year, totalResults: 0 },
    ...(parsed.meta?.note ? { message: parsed.meta.note } : {}),
  });
});

// ── Route: GET /health ────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    pythonBin: PYTHON_BIN,
    scriptPath: SCRIPT_PATH,
    defaultCsv: DEFAULT_CSV,
  });
});

// ── Global error handler ──────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error("[nexus] unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error." });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[nexus] Predictor API listening on http://localhost:${PORT}`);
  console.log(`[nexus] Python binary : ${PYTHON_BIN}`);
  console.log(`[nexus] Script path   : ${SCRIPT_PATH}`);
  console.log(`[nexus] Default CSV   : ${DEFAULT_CSV}`);
  console.log(`[nexus] Timeout       : ${PYTHON_TIMEOUT_MS}ms`);
});
