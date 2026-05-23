# TODO - Distrident Medical E-Commerce (modular)

## Stabilire setup (Iterația 0)
- [x] Aprobă tech stack: Next.js + NestJS + PostgreSQL + OpenSearch
- [ ] Definire schemă DB (Product/Variant/Category/Brand/Stock/Order/Invoice/Admin)
- [ ] Definire contract API (OpenAPI/Swagger) pentru catalog + auth + cart + admin

## Admin cont (MVP)
- [x] Creare mecanism superadmin + seeding inițial (admin)
- [ ] UI admin: login admin, acces la CRUD pentru produse/variante/categorii


## Iterația 1: Catalog + UI medical
- [ ] Design system (paletă, components)
- [ ] Implementare pagini: /, /categorii, /categorie/[slug], /produs/[slug]
- [ ] Backend endpoints catalog
- [ ] OpenSearch index & filtre faceted

## Iterația 2: Login B2B + Coș/Checkout
- [ ] Implementare auth (login, refresh token)
- [ ] Cart + checkout flow
- [ ] Protecție rute (coș/checkout doar după login)

## Iterația 3: Admin Dashboard + gestionare produse
- [ ] Admin auth + RBAC (admin/operator)
- [ ] CRUD produse/variante/categorii
- [ ] Import XLSX (job async) + mapare variante
- [ ] Gestionare stoc

## Iterația 4 (mai târziu): Facturi + plăți
- [ ] Integrare gateway plăți
- [ ] Generare facturi PDF

## Iterația 5: Hardening
- [ ] Rate limiting, audit logs GDPR
- [ ] Observability (logs/metrics)

