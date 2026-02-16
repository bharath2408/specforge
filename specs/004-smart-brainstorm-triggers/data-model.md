# Data Model

> Generated: 2026-02-15

## ER Diagram

```mermaid
erDiagram
    ToolSelection {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    SpecSignals {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    ToolOverride {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
```

## Entities

### ToolSelection

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### SpecSignals

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### ToolOverride

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

