# Cardrive database ER diagram

This diagram documents the **currently observed Production schema**, not the future CRM/used-car schema. It is intentionally limited to relationships verified from the current database and repository migrations. Some later-added fields and relationships need to be reconciled against the migration drift report before being treated as canonical.

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "id"
  PROFILES ||--o{ ORDERS : "customer_id"
  CARS ||--o{ ORDERS : "car_id"
  ORDERS ||--o{ ORDER_STATUS_HISTORY : "order_id"
  ORDERS ||--o| CREDIT_APPLICATIONS : "order_id"
  BANKS ||--o{ CREDIT_APPLICATIONS : "bank_id"

  BRANDS ||--o{ CAR_MODELS : "brand_id"
  BRANDS ||--o{ CARS : "brand_id"
  CAR_MODELS ||--o{ CARS : "model_id"
  CARS ||--o{ CAR_IMAGES : "car_id"
  CARS ||--o{ CAR_COLORS : "car_id"
  CAR_COLORS ||--o{ CAR_IMAGES : "color_id"

  DEALERS ||--o{ CARS : "dealer_id"
  DEALERS ||--o{ FINANCING_PROGRAM_DEALERS : "dealer_id"
  FINANCING_PROGRAMS ||--o{ FINANCING_PROGRAM_DEALERS : "financing_program_id"
  FINANCING_PROGRAMS ||--o{ FINANCING_PROGRAM_CARS : "financing_program_id"
  CARS ||--o{ FINANCING_PROGRAM_CARS : "car_id"
  FINANCING_PROGRAMS ||--o{ FINANCING_PROGRAM_RULES : "financing_program_id"
  BANKS ||--o{ FINANCING_PROGRAMS : "bank_id"

  CAR_CATEGORIES ||--o{ CAR_CATEGORY_ITEMS : "category_id"
  CARS ||--o{ CAR_CATEGORY_ITEMS : "car_id"

  PROFILES {
    uuid id PK
    text phone
    text full_name
    user_role role
    boolean is_active
  }
  BRANDS {
    uuid id PK
    text name
    text slug
    boolean is_active
  }
  CAR_MODELS {
    uuid id PK
    uuid brand_id FK
    text name
    text slug
  }
  CARS {
    uuid id PK
    uuid brand_id FK
    uuid model_id FK
    uuid dealer_id FK
    numeric price
    smallint year
    stock_status stock_status
  }
  CAR_IMAGES {
    uuid id PK
    uuid car_id FK
    uuid color_id FK
    text storage_path
  }
  ORDERS {
    uuid id PK
    uuid customer_id FK
    uuid car_id FK
    uuid financing_program_id
    order_status status
    numeric total_amount
  }
  ORDER_STATUS_HISTORY {
    uuid id PK
    uuid order_id FK
    uuid changed_by
    order_status new_status
  }
  CREDIT_APPLICATIONS {
    uuid id PK
    uuid order_id FK
    uuid bank_id FK
    text status
  }
  BANKS {
    uuid id PK
    text code
    text name
  }
  DEALERS {
    uuid id PK
    text name
    boolean is_active
  }
  FINANCING_PROGRAMS {
    uuid id PK
    uuid bank_id FK
    text name
    boolean is_active
  }
  FINANCING_PROGRAM_RULES {
    uuid id PK
    uuid financing_program_id FK
  }
  FINANCING_PROGRAM_CARS {
    uuid financing_program_id FK
    uuid car_id FK
  }
  FINANCING_PROGRAM_DEALERS {
    uuid financing_program_id FK
    uuid dealer_id FK
  }
  CAR_CATEGORIES {
    uuid id PK
    text key
    text name_uz
  }
  CAR_CATEGORY_ITEMS {
    uuid category_id FK
    uuid car_id FK
  }
  CAR_COLORS {
    uuid id PK
    uuid car_id FK
    text name_uz
  }
  HOME_BANNERS {
    uuid id PK
    text title_uz
    text image_url
  }
  OTP_VERIFICATIONS {
    uuid id PK
    text phone
    text code_hash
    otp_purpose purpose
    timestamptz expires_at
    timestamptz verified_at
  }
  AUDIT_LOGS {
    uuid id PK
    uuid actor_id
    text action
    text entity_type
  }
  PROMO_CODES {
    bigint id PK
    text code
    boolean used
  }
```

## Important notes

- `otp_verifications`, `audit_logs`, and `promo_codes` are operational/security tables; they should not be exposed for direct client CRUD.
- `profiles.id` references `auth.users.id`.
- `credit_applications.order_id` is unique in the original foundation migration.
- `car_category_items` is a many-to-many join table.
- The Production database has 21 public base tables in the inspected schema.
- This is not the target ERD for the future used-car marketplace. The used-car model must be introduced additively and must not overload the curated `cars` catalog.
