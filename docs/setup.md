# Konfigurimi lokal

## Teknologjitë dhe kërkesat

- PHP 8.2+ me PDO MySQL, mbstring, XML, cURL, OpenSSL, fileinfo dhe ZIP; Composer 2
- Laravel 12 dhe Sanctum 4
- MySQL 8 me `utf8mb4` si bazë e synuar
- Node.js 22.12+ dhe npm
- React 19, JavaScript/JSX, Vite 7 dhe Tailwind CSS 4
- Leaflet për hartat, në fazën përkatëse

Në kompjuterin lokal u gjet XAMPP me **MariaDB 10.4.32**, jo MySQL 8. Migrimet dhe lidhja u verifikuan me këtë server përmes driver-it `mysql`. Verifikimi në MySQL 8 mbetet për t'u bërë. Versionet e sakta të paketave ruhen në `backend/composer.lock` dhe `frontend/package-lock.json`.

## Instalimi

Dosja e projektit në këtë kompjuter është `C:\Users\ET\Documents\praktika-p1-thaqi`. Komandat më poshtë nisen nga kjo dosje; nuk nevojitet projekt ose repository i ri.

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
```

`Copy-Item` përdoret vetëm gjatë instalimit të parë. Në këtë kompjuter `.env` tashmë është krijuar dhe përmban çelësin dhe kredencialet lokale; mos e mbishkruani.

Krijoni bazën dhe një përdorues të veçantë nga një lidhje administrative MySQL. Zëvendësoni fjalëkalimin shembull me një fjalëkalim tuajin:

```sql
CREATE DATABASE lipjan_directory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lipjan_app'@'127.0.0.1' IDENTIFIED BY 'vendosni-nje-fjalekalim-tuajin';
GRANT ALL PRIVILEGES ON lipjan_directory.* TO 'lipjan_app'@'127.0.0.1';
```

Baza dhe përdoruesi janë krijuar tashmë në këtë kompjuter. `.env` përdor `DB_CONNECTION=mysql`, hostin `127.0.0.1`, portën `3306`, bazën `lipjan_directory` dhe përdoruesin `lipjan_app`. Vendosni fjalëkalimin vetëm te `DB_PASSWORD` në `.env`. React nuk merr kredenciale të bazës. Pas ndryshimit të konfigurimit përdorni `php artisan config:clear` dhe rinisni backend-in.

```powershell
# Nga backend/
php artisan migrate
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

Migrimet ruajnë tabelat e Laravel/Sanctum dhe shtojnë `categories`, `settlements`, `services`, `businesses`, `business_service`, `business_hours`, `business_images` dhe `advertisements`.

Për të mbushur bazën me të dhëna demonstrimi, nga `backend/`:

```powershell
php artisan db:seed
```

Krijohen 30 profile ilustruese (26 të publikuara, 2 drafte, 2 të arkivuara), 6 kategori, 4 vendbanime, 10 shërbime, 85 lidhje biznes-shërbim, 140 rreshta orari, 26 fotografi dhe 6 reklama. Reklamat përfshijnë 3 aktuale, 1 të planifikuar, 1 të skaduar dhe 1 të çaktivizuar. Datat llogariten në UTC nga koha e ekzekutimit; `is_active` është çelësi i aktivizimit, ndërsa scope `active()` kontrollon edhe datat dhe biznesin e publikuar.

Seeders mund të ekzekutohen përsëri pa dyfishuar rekordet ose ndryshuar ID-të. Ata rifreskojnë bizneset demo dhe afatet e reklamave demo, prandaj nuk duhen përdorur për të ruajtur ndryshime manuale mbi këto rekorde. Përdoruesit dhe bizneset jashtë grupit demo ruhen. `DatabaseSeeder` i ekzekuton të tre seeders brenda një transaksioni; një konflikt me një slug ekzistues jashtë grupit demo ndërpret transaksionin.

Profilet e seeder-it janë fiktive dhe mbajnë `is_demo=true` për dallim administrativ. Emrat dhe përshkrimet nuk identifikojnë biznese të regjistruara. Numrat e telefonit, adresat e sakta, email-et, faqet dhe koordinatat lihen bosh që të mos drejtojnë vizitorët te persona ose hyrje të paqena; `location_verified=false`. Për këtë arsye profilet ilustruese nuk kanë pin ose udhëzime. Sjellja e telefonit, email-it, website-it dhe hartës testohet me fixtures të kontrolluara. Orari dhe shërbimet e profileve janë gjithashtu ilustruese. Fotografitë tregojnë llojin e aktivitetit dhe nuk paraqesin ambientin e biznesit të emërtuar. Burimet, autorët dhe licenca janë në `backend/database/seeders/presentation-photos.json`; skedarët lokalë janë në `backend/public/demo/photos/`.

`PresentationAcceptanceTest` krijon një rekord të veçuar vetëm në bazën e testimit për të ushtruar publikimin, kontaktet, filtrin e website-it dhe koordinatat e së njëjtës faqe. Numri shembull `+383 00 000 000`, domeni i rezervuar `example.com` dhe adresa e shënuar si test nuk përdoren në katalogun e zhvillimit ose në prodhim; testi nuk kryen telefonatë, email apo hap udhëzimesh. Për një biznes real, publikimi vazhdon të kërkojë kontakt, adresë, koordinata dhe konfirmimin e vendndodhjes. Bizneset e mbështetura me burime publike shtohen veçmas, vetëm me komandën opsionale të dokumentuar më poshtë; seed-i standard mbetet ilustrues.

Kur seeders ekzekutohen sërish, ata ndryshojnë vetëm imazhet me rrugë të rezervuara `/demo/...` dhe reklamat me imazhin përkatës të seeder-it. Imazhet e ngarkuara nën `/storage/...` dhe reklamat me imazhe të personalizuara mbeten të pandryshuara edhe kur ndajnë biznesin dhe vendosjen e reklamës. Nëse një reklamë e seeder-it është personalizuar, seeder-i nuk krijon një kopje të dytë. ID-të e rekordeve ekzistuese ruhen.

Fotografitë vijnë nga Pexels dhe ruhen lokalisht me gjerësi deri në 960 pikselë. [Licenca e Pexels](https://www.pexels.com/license/) lejon përdorimin në faqe dhe reklama; autorët dhe URL-të e skedarëve burimorë dokumentohen për secilën fotografi në manifest. Fotografitë nuk janë logo dhe nuk nënkuptojnë mbështetje nga personat ose markat që mund të shihen në to.

Drafteve mund t'u mungojnë të dhëna. Kategoritë dhe vendbanimet nuk fshihen kur përdoren nga biznese; shërbimet duhen shkëputur përpara fshirjes. Paneli administrues përdor arkivimin, jo fshirjen fizike: rreshti ruhet, por nuk shfaqet publikisht dhe reklamat e lidhura nuk janë më aktive. Për bizneset reale, administratori konfirmon përputhjen e koordinatave me adresën para publikimit. Bizneset demo mbeten të shënuara si të simuluara.

Orari përdor ditët `0` (e diel) deri `6` (e shtunë), me një interval për ditë. Mungesa e rreshtave do të thotë orar i papublikuar. Ditët e mbyllura kanë të dy orët `null`; ora e mbylljes më e vogël se ajo e hapjes nënkupton ditën pasuese. Kufizimet e koordinatave, ditëve/orëve dhe intervalit të reklamës aplikohen në MariaDB/MySQL. SQLite përdoret për kontrolle të shpejta, pa këto CHECK shtesë. Për MySQL kërkohet 8.0.16+ për zbatimin e [CHECK constraints](https://dev.mysql.com/doc/refman/8.0/en/create-table-check-constraints.html); MySQL 8 nuk është testuar ende.

Në një terminal tjetër, nga rrënja e projektit:

```powershell
cd frontend
npm ci
npm run dev
```

Hapni [frontend-in lokal](http://127.0.0.1:5173). Përdorni vazhdimisht `127.0.0.1` gjatë zhvillimit. Vite mban portën `5173` dhe përcjell `/api`, `/sanctum`, `/demo` dhe `/storage` te Laravel në portën `8000`. Kjo mban kërkesat në të njëjtën origjinë nga këndvështrimi i shfletuesit. Në prodhim këto rrugë duhen përcjellë te Laravel nga web server-i; `vite preview` shërben vetëm skedarët statikë.

## Biznese me vendndodhje nga burime publike (opsionale)

Për demonstrimin e hartës me të dhëna konkrete, seeder-i i veçantë `VerifiedLipjanBusinessesSeeder` shton **Restaurant Mangall**, **Neptun Lipjan** dhe **Ramjani SH.P.K.**, me adresa, kontakte dhe koordinata të dokumentuara. Referencat, saktësia e pin-ave dhe kufizimet e të dhënave janë te [burimet e bizneseve](verified-business-sources.md).

Nga `backend/`, pasi të keni ekzekutuar `php artisan db:seed`:

```powershell
php artisan db:seed --class=VerifiedLipjanBusinessesSeeder
```

Ky është një hap i qartë **opsional**, jo pjesë e seeder-it standard. Në një bazë fillimisht të zbrazët, pas të dy komandave ka 33 biznese, prej tyre 29 të publikuara, dhe pesë vendbanime. Mund të kërkoni `Mangall`, `Neptun` ose `Ramjani`, të hapni profilin përkatës dhe të kontrolloni pin-in, popup-in dhe linkun e udhëzimeve. Numri i telefonit është i publikuar nga burimi; mos kryeni thirrje testimi te bizneset pa arsye. Seeder-i nuk mbishkruan editimet e administratorit në rikzekutim.

Profilet ilustruese të mbetura nuk marrin koordinata të shpikura. Një pin i marrë nga burime publike nuk përbën verifikim të pavarur të hyrjes së ndërtesës. Kjo komandë nuk e shënon automatikisht skenarin T-06 si të kaluar: veprimet reale të telefonit, email-it dhe aplikacionit të udhëzimeve duhen provuar në pajisje të përshtatshme.


## Nisja lokale e bazës

XAMPP mund të niset nga paneli i tij. Gjatë konfigurimit lokal, serveri dështoi nga mungesa e memories së alokueshme në Windows (gabimi 1455). U nis me kufij më të vegjël vetëm për atë proces, pa ndryshuar konfigurimin global dhe pa fshirë ose riparuar manualisht të dhëna ekzistuese:

```powershell
& C:\xampp\mysql\bin\mysqld.exe --defaults-file=C:\xampp\mysql\bin\my.ini --standalone --bind-address=127.0.0.1 --innodb-buffer-pool-size=8M --innodb-log-buffer-size=1M --aria-pagecache-buffer-size=8M --key-buffer-size=4M --max-connections=20
```

Përdoreni vetëm kur serveri nuk është tashmë aktiv. Këto janë vlera për verifikim lokal me ngarkesë të vogël; nuk janë konfigurim prodhimi.
