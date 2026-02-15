Score a feature spec on 5 quality dimensions.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, list available specs in the `specs/` directory and ask which one to review.

Run: `specforge review <spec-id>`

Options:
- `--focus <areas...>` — Only score specific dimensions (e.g., completeness, clarity)
- `--strict` — Use stricter scoring thresholds
- `--ci` — CI mode: exit with code 1 if below --min-score or verdict is POOR
- `--min-score <n>` — Minimum passing score for --ci mode

This scores the spec across 5 dimensions (0–20 each, totaling 0–100):
1. **Completeness** — Are all sections present and populated?
2. **Clarity** — Are descriptions specific and unambiguous?
3. **Testability** — Can requirements be verified?
4. **Feasibility** — Is scope realistic?
5. **Consistency** — Do sections cross-reference correctly?

Verdicts: EXCELLENT (≥80), GOOD (≥60), NEEDS_WORK (≥40), POOR (<40).

After showing the score table and top suggestions, help the user improve low-scoring dimensions by editing the spec.