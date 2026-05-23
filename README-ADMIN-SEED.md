# Admin seeding (MVP)

Acest fișier definește cerința pentru un cont de admin (MVP) care va putea manipula produse/variante/categorii.

## Ce va face implementarea
- Create superadmin seeding (ex: `admin@local.test`) la start (dev) sau la un script `seed`.
- Parolă hashing (bcrypt/argon2).
- Rol: `admin` (sau `superadmin`), cu acces la rutele `/admin/*`.

## Recomandare parole
- În dev: `Admin123!` (doar exemplu) / se cere schimbare la prima autentificare.
- În prod: parola se setează din variabile de mediu.

## Parametri necesari în code (variabile env)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_ROLE` (ex: `admin`)

