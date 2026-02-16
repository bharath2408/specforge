# Data Model

> Generated: 2026-02-15

## ER Diagram

```mermaid
erDiagram
    CustomCommand {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    CommandVariable {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    CommandRegistry {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
```

## Entities

### CustomCommand

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### CommandVariable

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### CommandRegistry

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

