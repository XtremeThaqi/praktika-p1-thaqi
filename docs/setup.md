# Instalimi lokal

**Kërkesat:** PHP 8.2+, Composer, MySQL/MariaDB, Node.js 22.12+ dhe npm.

## 1. Databaza

Krijoni një databazë MySQL/MariaDB:

```sql
CREATE DATABASE lipjan_directory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. Backend

Kopjoni `backend/.env.example` në `backend/.env` dhe vendosni `DB_DATABASE`, `DB_USERNAME` dhe `DB_PASSWORD` sipas databazës suaj. Mos publikoni `.env`.

Nga rrënja e projektit:

```bash
cd backend
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan admin:create
php artisan serve --host=127.0.0.1 --port=8000
```

`admin:create` kërkon emrin, email-in dhe fjalëkalimin e administratorit. `db:seed` shton të dhëna demonstrimi; mos e përsëritni pas ndryshimeve manuale në ato të dhëna.

## 3. Frontend

Në një terminal tjetër, nga rrënja e projektit:

```bash
cd frontend
npm ci
npm run dev
```

Hapni **http://127.0.0.1:5173**.
