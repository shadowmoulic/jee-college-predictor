#!/usr/bin/env python3
"""
Nexus College Predictor — Deterministic Rank-Based Filtering Engine
=====================================================================
Uses 2025 JoSAA final-round closing ranks as the sole baseline.

Thresholds (identical to mathongo's live predictor):
  HIGH     : user_rank ≤ closing_rank × 0.65  → 35 %+ safety margin
  MODERATE : user_rank ≤ closing_rank × 1.00  → within 2025 cutoff
  LOW      : user_rank ≤ closing_rank × 1.15  → above 2025 cutoff, but
             JoSAA expands seats every year, so the buffer is realistic

Colleges outside the 1.15× envelope are excluded entirely.

Input  (stdin) : JSON { "rank", "category", "seatType", "csvPath", "year"? }
Output (stdout): JSON { "data", "visualization", "meta" }
Errors → stderr only (stdout stays clean for JSON parsing in Node).
"""

import sys
import json
import io
import base64

import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.ticker import FuncFormatter

# ── Outer filter boundary ─────────────────────────────────────────────────────
# Colleges where user_rank > CR × 1.15 are excluded entirely.
# Within the envelope, rows where user_rank > CR are shown as LOW (seat-increase
# buffer — JoSAA expands seats 3–8 % each year, making slight stretches viable).

LOW_THRESHOLD = 1.15   # outer filter boundary only — NOT a probability tier

STATUS_COLOURS = {
    "High":   "#27ae60",   # green  — virtually guaranteed / large cushion
    "Medium": "#3498db",   # blue   — within cutoff but ≤ 15 % safety margin
    "Low":    "#f39c12",   # amber  — above cutoff, possible via seat expansion
}
STATUS_ORDER = ["High", "Medium", "Low"]   # legend order


# ── Data loading ──────────────────────────────────────────────────────────────

def load_and_clean(csv_path: str, target_year: int = 2025) -> pd.DataFrame:
    """
    Load and clean the CSV.

    Year / Round awareness
    ─────────────────────
    If the CSV has a 'Year' column the script isolates the target year
    (defaulting to 2025, falling back to the latest year present).
    If it also has a 'Round' column it keeps only the final (max) round so
    that the closing ranks reflect the last allotment, not an early round.

    If neither column exists the CSV is assumed to already contain 2025
    final-round data.
    """
    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()

    required = {"Institute", "Program", "Category", "Seat Type",
                "Opening Rank", "Closing Rank"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV is missing required columns: {missing}")

    # ── Optional year / round filtering ──────────────────────────────────────
    if "Year" in df.columns:
        df["Year"] = pd.to_numeric(df["Year"], errors="coerce")
        available_years = sorted(df["Year"].dropna().unique())
        actual_year = (
            target_year if target_year in available_years
            else int(available_years[-1])   # fall back to latest year
        )
        df = df[df["Year"] == actual_year].copy()

        if "Round" in df.columns:
            df["Round"] = pd.to_numeric(df["Round"], errors="coerce")
            final_round = df["Round"].max()
            df = df[df["Round"] == final_round].copy()

    # ── Rank cleaning ─────────────────────────────────────────────────────────
    df["Opening Rank"] = pd.to_numeric(df["Opening Rank"], errors="coerce")
    df["Closing Rank"] = pd.to_numeric(df["Closing Rank"], errors="coerce")
    df.dropna(subset=["Opening Rank", "Closing Rank"], inplace=True)
    df["Opening Rank"] = df["Opening Rank"].astype(int)
    df["Closing Rank"] = df["Closing Rank"].astype(int)

    for col in ("Institute", "Program", "Category", "Seat Type"):
        if col in df.columns:
            df[col] = df[col].str.strip()

    return df


# ── Prediction logic ──────────────────────────────────────────────────────────

def _determine_probability(opening_rank: int, closing_rank: int, user_rank: int) -> str:
    """
    Three-tier admission probability using Opening AND Closing rank.

    In JEE, lower numbers are better (rank 1 is the best).

    LOW    — user_rank > closing_rank
             The 2025 cutoff is already above the user's rank.  Shown only
             because JoSAA seat expansion makes it a realistic stretch for 2026.

    HIGH   — user_rank ≤ opening_rank
             The user is better-ranked than even the best student who got this
             seat in 2025 → virtually guaranteed.

             OR: user_rank is between OR and CR but the safety cushion
             (CR − rank) is ≥ 15 % of the closing rank → comfortably within.

    MEDIUM — user_rank is between OR and CR with a safety cushion < 15 % of CR
             → inside the cutoff but close to the edge.
    """
    if user_rank > closing_rank:
        return "Low"
    if user_rank <= opening_rank:
        return "High"
    cushion = closing_rank - user_rank
    safety_margin = cushion / closing_rank
    return "High" if safety_margin >= 0.15 else "Medium"


def run_pipeline(
    df: pd.DataFrame,
    user_rank: int,
    category: str,
    seat_type: str,
) -> pd.DataFrame:
    """
    Five-step deterministic pipeline.  Returns ≤ 20 rows.
    """
    # Step 1 — exact match, case-insensitive
    mask = (
        df["Category"].str.lower() == category.strip().lower()
    ) & (
        df["Seat Type"].str.lower() == seat_type.strip().lower()
    )
    df_f = df[mask].copy()
    if df_f.empty:
        return df_f

    # Step 2 — outer envelope filter: keep rows where user_rank ≤ CR × 1.15
    #   Equivalently: CR ≥ user_rank / 1.15
    #   Rows further above the 2025 cutoff than 15 % are not shown.
    min_closing = user_rank / LOW_THRESHOLD
    df_f = df_f[df_f["Closing Rank"] >= min_closing].copy()
    if df_f.empty:
        return df_f

    # Step 3 — rank margin (positive → user is safer than cutoff; negative → stretch)
    df_f["Rank Margin"] = df_f["Closing Rank"] - user_rank

    # Step 4 — admission chance label (uses both Opening and Closing rank)
    df_f["Chance"] = df_f.apply(
        lambda r: _determine_probability(
            int(r["Opening Rank"]), int(r["Closing Rank"]), user_rank
        ),
        axis=1,
    )

    # Step 5 — sort: HIGH first, then MEDIUM, then LOW; within each tier by closing rank ascending
    CHANCE_ORDER = {"High": 0, "Medium": 1, "Low": 2}
    df_f["_tier"] = df_f["Chance"].map(CHANCE_ORDER)
    df_f = (
        df_f.sort_values(["_tier", "Closing Rank"], ascending=[True, True])
            .drop(columns=["_tier"])
            .head(20)
            .reset_index(drop=True)
    )
    return df_f


# ── Visualisation ─────────────────────────────────────────────────────────────

def _label(institute: str, program: str, max_len: int = 46) -> str:
    s = f"{institute} — {program}"
    return s if len(s) <= max_len else s[: max_len - 1] + "…"


def generate_chart(df: pd.DataFrame, user_rank: int, data_year: int) -> str:
    """
    Horizontal bar chart.  No files written to disk — returns a data-URI string.

    Visual logic
    ────────────
    • Bar length = 2025 closing rank.
    • Dashed vertical line = user's rank.
    • Bars stopping LEFT of the line are LOW-chance (2025 cutoff < user rank),
      but are shown because seat expansion makes them reachable in 2026.
    • Bars reaching or crossing the line are MODERATE / HIGH.
    • Y-axis inverted: most competitive (lowest CR) rows at the top.
    """
    n = len(df)
    fig_height = max(7, n * 0.58 + 2.5)
    fig, ax = plt.subplots(figsize=(15, fig_height))
    fig.patch.set_facecolor("#f8f9fa")
    ax.set_facecolor("#f8f9fa")

    labels        = [_label(r["Institute"], r["Program"]) for _, r in df.iterrows()]
    closing_ranks = df["Closing Rank"].tolist()
    chances       = df["Chance"].tolist()
    margins       = df["Rank Margin"].tolist()
    colours       = [STATUS_COLOURS[c] for c in chances]
    y_pos         = range(n)

    # ── Bars ──────────────────────────────────────────────────────────────────
    bars = ax.barh(
        y_pos,
        closing_ranks,
        color=colours,
        edgecolor="#ffffff",
        linewidth=0.7,
        height=0.68,
        zorder=2,
    )

    # Inline margin annotation
    x_pad = max(closing_ranks) * 0.008 if closing_ranks else 100
    for bar, margin, chance in zip(bars, margins, chances):
        sign    = "+" if margin >= 0 else ""
        txt     = f"{sign}{int(margin):,}"
        colour  = "#1a7a3f" if margin > 0 else ("#c0392b" if margin < 0 else "#555555")
        ax.text(
            bar.get_width() + x_pad,
            bar.get_y() + bar.get_height() / 2,
            txt,
            va="center", ha="left",
            fontsize=7.8, color=colour, fontweight="bold",
            zorder=3,
        )

    # ── User rank dashed line ─────────────────────────────────────────────────
    ax.axvline(
        x=user_rank,
        color="#2c3e50",
        linewidth=2.0,
        linestyle="--",
        zorder=4,
        label=f"Your Rank: {user_rank:,}",
    )

    # Subtle amber wash left of the line = stretch zone
    ax.axvspan(0, user_rank, alpha=0.05, color="#f39c12", zorder=1)

    # ── Axes ──────────────────────────────────────────────────────────────────
    ax.set_yticks(list(y_pos))
    ax.set_yticklabels(labels, fontsize=8.8)
    ax.invert_yaxis()   # lowest (most competitive) closing rank at top

    right_pad = max(closing_ranks) * 0.10 if closing_ranks else 1000
    ax.set_xlim(0, max(closing_ranks) + right_pad)

    ax.xaxis.set_major_formatter(FuncFormatter(lambda x, _: f"{int(x):,}"))
    ax.set_xlabel(f"JoSAA {data_year} Closing Rank (Final Round)", fontsize=11, labelpad=9)
    ax.set_title(
        f"Nexus Predictor — Top {n} Options  ·  Your Rank {user_rank:,}  ·  Based on JoSAA {data_year} Final Round\n"
        "LOW bars left of the dashed line are stretch goals — JoSAA seat additions make them reachable in 2026",
        fontsize=10.5,
        fontweight="bold",
        pad=14,
        color="#2c3e50",
    )

    for sp in ("top", "right"):
        ax.spines[sp].set_visible(False)
    ax.spines["left"].set_color("#cccccc")
    ax.spines["bottom"].set_color("#cccccc")
    ax.grid(axis="x", linestyle=":", linewidth=0.7, alpha=0.5, zorder=0)

    # ── Legend ────────────────────────────────────────────────────────────────
    patches = [
        mpatches.Patch(color=STATUS_COLOURS[s], label=s) for s in STATUS_ORDER
    ]
    rank_line = plt.Line2D(
        [0], [0], color="#2c3e50", linewidth=2.0, linestyle="--",
        label=f"Your Rank: {user_rank:,}",
    )
    ax.legend(
        handles=[rank_line] + patches,
        loc="lower right",
        fontsize=8.8,
        framealpha=0.92,
        edgecolor="#dddddd",
        facecolor="#ffffff",
    )

    plt.tight_layout(pad=1.6)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=130, bbox_inches="tight",
                facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode("utf-8")
    return f"data:image/png;base64,{b64}"


# ── Summary helpers ───────────────────────────────────────────────────────────

def build_summary(df: pd.DataFrame) -> dict:
    counts = df["Chance"].value_counts().to_dict()
    return {
        "High":     counts.get("High",     0),
        "Medium": counts.get("Medium", 0),
        "Low":      counts.get("Low",      0),
    }


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    raw = sys.stdin.read().strip()
    if not raw:
        sys.stderr.write("ERROR: empty stdin — no JSON payload received\n")
        sys.exit(1)

    try:
        args = json.loads(raw)
    except json.JSONDecodeError as exc:
        sys.stderr.write(f"ERROR: invalid JSON on stdin — {exc}\n")
        sys.exit(1)

    try:
        user_rank = int(args["rank"])
        category  = str(args["category"])
        seat_type = str(args["seatType"])
        csv_path  = str(args.get("csvPath", "data/josaa_cutoffs.csv"))
        target_year = int(args.get("year", 2025))
    except (KeyError, ValueError, TypeError) as exc:
        sys.stderr.write(f"ERROR: bad or missing field — {exc}\n")
        sys.exit(1)

    if user_rank <= 0:
        sys.stderr.write("ERROR: rank must be a positive integer\n")
        sys.exit(1)

    try:
        df = load_and_clean(csv_path, target_year=target_year)
    except FileNotFoundError:
        sys.stderr.write(f"ERROR: CSV not found at '{csv_path}'\n")
        sys.exit(1)
    except Exception as exc:
        sys.stderr.write(f"ERROR loading CSV: {exc}\n")
        sys.exit(1)

    # Report which year's data is actually being used
    data_year = target_year
    if "Year" in df.columns and not df.empty:
        data_year = int(df["Year"].iloc[0])

    try:
        df_result = run_pipeline(df, user_rank, category, seat_type)
    except Exception as exc:
        sys.stderr.write(f"ERROR in pipeline: {exc}\n")
        sys.exit(1)

    if df_result.empty:
        payload = {
            "data": [],
            "visualization": None,
            "summary": {"High": 0, "Moderate": 0, "Low": 0},
            "meta": {
                "dataYear": data_year,
                "userRank": user_rank,
                "category": category,
                "seatType": seat_type,
                "note": (
                    f"No colleges found for rank {user_rank:,}, "
                    f"category '{category}', seat type '{seat_type}'. "
                    "Try a different category or seat type."
                ),
            },
        }
        print(json.dumps(payload))
        return

    try:
        visualization = generate_chart(df_result, user_rank, data_year)
    except Exception as exc:
        sys.stderr.write(f"WARNING: chart failed ({exc}) — returning data only\n")
        visualization = None

    # pd int64 → plain int via json round-trip
    records = json.loads(df_result.to_json(orient="records"))

    payload = {
        "data": records,
        "visualization": visualization,
        "summary": build_summary(df_result),
        "meta": {
            "dataYear":    data_year,
            "userRank":    user_rank,
            "category":    category,
            "seatType":    seat_type,
            "thresholds": {
                "High":   "rank ≤ openingRank  OR  safetyMargin(CR) ≥ 15 %",
                "Medium": "openingRank < rank ≤ closingRank  AND  safetyMargin(CR) < 15 %",
                "Low":    f"rank > closingRank  AND  rank ≤ closingRank × {LOW_THRESHOLD}",
            },
        },
    }
    print(json.dumps(payload))


if __name__ == "__main__":
    main()
