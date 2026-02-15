# Data Model

> Generated: 2026-02-15

## ER Diagram

```mermaid
erDiagram
    PlaywrightTestFile {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    ScenarioTestCase {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    PageObject {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    DataFactory {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    AuthFixture {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
    TestConfig {
        uuid id
        datetime createdAt
        datetime updatedAt
    }
```

## Entities

### PlaywrightTestFile

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### ScenarioTestCase

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### PageObject

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### DataFactory

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### AuthFixture

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

### TestConfig

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PRIMARY KEY |
| createdAt | datetime | NOT NULL DEFAULT NOW() |
| updatedAt | datetime | NOT NULL DEFAULT NOW() |

