# Katalogu i bizneseve të komunës së Lipjanit

Projekt i praktikës profesionale për të kërkuar biznese, për të parë shërbimet dhe vendndodhjen e tyre dhe për t'i kontaktuar. Platforma është projekt studentor, jo regjistër zyrtar i komunës.

## Gjendja aktuale

Është përgatitur struktura fillestare e React me JSX dhe Tailwind. Laravel ende nuk është instaluar: mjedisi i punës nuk lidhet me Packagist. As instalimi i varësive të frontend-it dhe as build-i nuk janë verifikuar. Faqja fillestare tregon qartë se projekti është në zhvillim; nuk ka katalog ose funksione administrative ende.

## Teknologjitë dhe kërkesat

- PHP 8.2+, Composer 2 dhe Laravel 12 (planifikuar)
- MySQL 8 me `utf8mb4`
- Node.js 22.12+ dhe npm
- React 19, JavaScript/JSX, Vite 7 dhe Tailwind CSS 4
- Leaflet për hartat dhe Laravel Sanctum për hyrjen administrative (planifikuar)

Laravel 12 është zgjedhur për pajtueshmëri me PHP 8.2 të instaluar. Frontend dhe backend mbahen në të njëjtin repository, në dosje të ndara. Nuk përdoret TypeScript.

## Nisja e frontend-it

```sh
cd frontend
npm install
npm run dev
```

Për kontrollin e build-it: `npm run build`. `package-lock.json` do të krijohet dhe të ruhet në commit pasi instalimi të përfundojë me sukses; më pas përdoret `npm ci`.

## Instalimi i backend-it — hapi i bllokuar

Nga rrënja e projektit, kur Packagist të jetë i arritshëm:

```sh
composer create-project laravel/laravel backend "^12.0" --no-interaction --prefer-dist
cd backend
php artisan key:generate
php artisan serve --host=127.0.0.1 --port=8000
```

Pas krijimit të aplikacionit, konfigurimi lokal `.env` do të përdorë `DB_CONNECTION=mysql`, hostin dhe kredencialet lokale dhe databazën `lipjan_directory`. Mos ruani `.env` në Git. Kredencialet nuk duhen vendosur në React.

Migrations, seeders dhe `php artisan migrate --seed` do të dokumentohen pasi të implementohen. Aktualisht nuk ekzistojnë tabela të projektit ose llogari administratori. Vite përcjell `/api` dhe `/sanctum` te porta 8000; endpoint-et ende nuk janë implementuar.

## Plani dhe verifikimi

Shihni [planin](docs/development-plan.md) dhe [skenarët e pranimit](docs/acceptance-tests.md). Screenshots dhe udhëzimet e demonstrimit shtohen kur rrjedhat kryesore funksionojnë.

Punohet në feature branches me commits që përfaqësojnë ndryshime reale. Bashkimi në `main` bëhet përmes Pull Request pasi të kalojnë kontrollet. Nuk ka ende remote GitHub; emri i kërkuar është `praktika-p1-thaqi`.
