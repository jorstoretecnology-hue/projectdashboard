# 🔐 Security Audit Prompt for Qwen CLI

## Context
You are performing a security audit for a SaaS multi-tenant application. This project follows the guidelines in `docs/SECURITY_QUICK_REFERENCE.md`.

## Your Task
Execute the following validations and generate BOTH a markdown report (for humans) and a JSON report (for CI/CD validation).

### 1. Type Check & Linting
Run: `npm run check` (or `npm run type-check` + `npm run lint`)

Count:
- Total type errors
- Any type usage (prohibited by security guidelines)
- Console.log statements (prohibited in production)

### 2. Dependency Audit
Run: `npm audit`

Count:
- Critical vulnerabilities
- High vulnerabilities
- Total vulnerabilities

### 3. Code Security Scan
Search the codebase for:
- `select('*')` or `select * from` (prohibited - must use explicit columns)
- Missing RLS (Row Level Security) in database queries
- Missing Zod validation in API endpoints
- Hardcoded secrets or API keys

### 4. Test Coverage
Run: `npm test`

Report:
- Tests passed
- Tests failed
- Coverage percentage

## Output Format

### Markdown Report (docs/SECURITY_PIPELINE_YYYYMMDD.md)
```markdown
# 🔐 Security Pipeline Report
**Date:** YYYY-MM-DD
**Commit:** [commit-hash]

## Executive Summary
**Status:** PASS/FAIL/OBSERVATIONS

## Type Check & Linting
- Type Errors: X
- Any Types: X
- Console.log: X

## Dependencies
- Critical Vulnerabilities: X
- High Vulnerabilities: X
- Total: X

## Code Security
- select(*) Queries: X
- Missing RLS: X
- Missing Zod Validation: X
- Hardcoded Secrets: X

## Tests
- Passed: X
- Failed: X
- Coverage: X%

## Detailed Findings
[List each finding with file path and line number]

## Recommendations
[List actionable recommendations]
```

### JSON Report (docs/SECURITY_PIPELINE_YYYYMMDD.json)
```json
{
  "date": "YYYY-MM-DD",
  "commit": "commit-hash",
  "status": "pass|fail|with_observations",
  "errors": {
    "typeErrors": 0,
    "anyTypes": 0,
    "consoleLogs": 0,
    "selectStarQueries": 0,
    "missingRls": 0,
    "missingZodValidation": 0,
    "hardcodedSecrets": 0
  },
  "tests": {
    "passed": 0,
    "failed": 0,
    "coverage": 0
  },
  "dependencies": {
    "critical": 0,
    "high": 0,
    "moderate": 0,
    "low": 0,
    "total": 0
  },
  "findings": [
    {
      "type": "type_error|security|dependency|test",
      "severity": "critical|high|moderate|low",
      "file": "path/to/file.ts",
      "line": 0,
      "description": "Description of the issue"
    }
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ]
}
```

## Critical Thresholds (CI/CD Gates)
The CI/CD pipeline will FAIL if any of these conditions are met:
- `errors.typeErrors > 0`
- `errors.consoleLogs > 0`
- `errors.selectStarQueries > 0`
- `dependencies.critical > 0`
- `dependencies.high > 0`
- `tests.failed > 0`

## Instructions
1. Execute all validations
2. Generate the markdown report for human review
3. Generate the JSON report with exact structure above
4. Be precise with file paths and line numbers in findings
5. Count accurately - these numbers will trigger CI/CD gates
