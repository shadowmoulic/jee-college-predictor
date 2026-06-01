# Nexus Predictor Backend

This directory contains the deterministic rank-based filtering backend. It is an Express API server that interfaces with a high-performance Python engine (`predictor.py`) via `stdin/stdout` streaming.

---

## Architecture Overview

1. **Express Server (`server.js`)**: Listens on port `4000`. Exposes a POST endpoint at `/api/predict` and a GET endpoint at `/health`.
2. **Python Engine (`predictor.py`)**: A raw data filtering and charting script. Expects structured JSON on `stdin` and writes JSON to `stdout` (with all log/error output isolated to `stderr`).
3. **Data Dependency**: Sourced by default from `data/josaa_cutoffs.csv`.

---

## Getting Started

### 1. Installation

Install node packages:
```bash
npm install
```

### 2. Python Virtual Environment Setup

Since `predictor.py` requires numerical and plotting libraries (`pandas` and `matplotlib`), set up a shared virtual environment in the root directory:

```bash
# Go to the root directory
cd ..

# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate

# Install requirements
pip install -r nexus-predictor/requirements.txt
```

### 3. Run in Development Mode

Run the Express server with file watching enabled:
```bash
# Inside nexus-predictor/
npm run dev
```

The server will automatically detect and use the parent folder's virtual environment (`../.venv/bin/python3`) to execute the Python script.

---

## API Endpoints

### `POST /api/predict`
Calculates probability thresholds (`HIGH` / `MODERATE` / `LOW`) and generates a comparative visual chart.

- **Request Body**:
  ```json
  {
    "rank": 2900,
    "category": "OBC-NCL",
    "seatType": "OBC-NCL",
    "csvPath": "data/josaa_cutoffs.csv"
  }
  ```

- **Response Shape**:
  ```json
  {
    "success": true,
    "data": [
      {
        "institute": "Indian Institute of Technology Bombay",
        "program": "Computer Science and Engineering (4 Years, B.Tech)",
        "closing_rank": 66,
        "status": "Stretch / Ambitious"
      }
    ],
    "visualization": "data:image/png;base64,iVBORw0KGgo...",
    "meta": {
      "rank": 2900,
      "category": "OBC-NCL",
      "seatType": "OBC-NCL",
      "totalResults": 1
    }
  }
  ```

### `GET /health`
Returns runtime configurations, pathing bindings, and environment diagnostics.

- **Response Shape**:
  ```json
  {
    "status": "ok",
    "pythonBin": "/Users/suvanghosh/Downloads/JEE_College_predicter/.venv/bin/python3",
    "scriptPath": "/Users/suvanghosh/Downloads/JEE_College_predicter/nexus-predictor/predictor.py",
    "defaultCsv": "/Users/suvanghosh/Downloads/JEE_College_predicter/nexus-predictor/data/josaa_cutoffs.csv"
  }
  ```
