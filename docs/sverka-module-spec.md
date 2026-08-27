# Bank / Diler Sverka Module

## Scope
Extend the admin sales analytics into an operational reconciliation module without changing existing order/credit flows.

## Filters
- Sana: dan
- Sana: gacha
- Barcha banklar
- Barcha dilerlar
- Barcha kredit dasturlari

All dashboard metrics and drill-down tables use the same active filters.

## Drill-down
Each KPI and grouped row is clickable and opens a filtered detail table. Detail columns:
- Ariza/buyurtma ID
- Ariza berilgan sana-vaqt
- Mijoz
- Telefon
- Avtomobil, model
- Rang
- Avtomobil narxi
- Boshlang'ich to'lov
- Kredit summasi
- Foiz stavkasi
- Kredit muddati
- Bank
- Kredit dasturi
- Diler
- Sotuv turi
- Holat
- Bankka yuborilgan sana-vaqt
- Menejer izohi

## Excel
Provide two exports from the active filtered result set:
1. `Sotuvlar reyestri.xlsx` — sales/order reconciliation register.
2. `Kredit arizalari reyestri.xlsx` — credit application register including consent timestamp, submission timestamp and bank response status.

Exports must contain the same fields as the corresponding detail table and respect active filters.

## Manager editing
Managers can edit operationally mutable order/application fields after a customer call (for example color, down payment, term, notes). Immutable identity/consent fields cannot be edited from the normal form.

Every change is recorded in an audit log with:
- record ID
- field name
- old value
- new value
- changed by
- changed at
- reason/note

## Reconciliation
Add a reconciliation view with filtered rows, totals, record count, export action and a clear distinction between customer-submitted values, manager-confirmed values and values actually sent to the bank.

## Safety
Do not remove or rewrite existing working order, credit, consent or authentication logic. Additive changes only; preserve existing data and IDs. Any database migration must be backward-compatible and nullable where appropriate.
