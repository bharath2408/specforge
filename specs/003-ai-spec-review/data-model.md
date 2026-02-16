# Data Model

> Generated: 2026-02-15

## ER Diagram

```mermaid
erDiagram
    ReviewReport {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    ReviewFinding {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    ScoreCard {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    SuggestedScenario {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    ReviewConfig {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
```

## Entities

### ReviewReport

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### ReviewFinding

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### ScoreCard

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### SuggestedScenario

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### ReviewConfig

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

