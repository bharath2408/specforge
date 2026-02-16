# Data Model

> Generated: 2026-02-15

## ER Diagram

```mermaid
erDiagram
    TestSuite {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    TestFixture {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    CommandResult {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    TestReport {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
```

## Entities

### TestSuite

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### TestFixture

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### CommandResult

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### TestReport

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

