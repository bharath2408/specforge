Run consistency analysis across all SpecForge artifacts.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, analyze all specs.

Run: `specforge analyze [spec-id]`

This cross-validates: constitution compliance (CRITICAL), coverage gaps (HIGH), missing tests (MEDIUM), naming issues (LOW), entity mismatches with .spec.yaml models.

Show findings and help the user resolve any issues found.