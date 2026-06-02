# Mia & Srđan — Wedding Memories

Moderan, elegantan i responsive wedding web sajt za prikupljanje fotografija i video uspomena gostiju za vjenčanje **Mia & Srđan — 21.08.2026.**

## Šta sajt sadrži

- Hero sekciju sa naslovom i datumom vjenčanja
- Uputstvo za upload fajlova
- Drag & drop upload zonu
- Upload više fajlova odjednom
- Podršku za slike i video zapise
- Validaciju maksimalne veličine fajla do 50MB
- Progress bar tokom upload-a
- Poruku potvrde nakon uspješnog upload-a
- QR kod koji vodi na objavljeni sajt
- Pripremu za Google Drive integraciju preko environment konfiguracije

## Podržani formati

Slike:

- `.jpg`
- `.jpeg`
- `.png`
- `.heic`

Video:

- `.mp4`
- `.mov`

## Pokretanje lokalno

Najjednostavnije je otvoriti `index.html` direktno u browseru. Za realističnije testiranje lokalnog hostinga možete pokrenuti:

```bash
python3 -m http.server 8080
```

Zatim otvorite:

```text
http://localhost:8080
```

## Google Drive integracija preko `.env` podataka

Frontend ne smije direktno sadržati Google Drive private key ili servisne kredencijale. Zbog sigurnosti, fajlovi se šalju na backend/serverless endpoint koji čita `.env` vrijednosti i zatim uploaduje fajlove u Google Drive.

Preporučene `.env` vrijednosti za backend ili serverless funkciju:

```env
GOOGLE_DRIVE_FOLDER_ID="your-google-drive-folder-id"
GOOGLE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
WEDDING_UPLOAD_ENDPOINT="https://your-domain.com/api/upload"
WEDDING_SITE_URL="https://your-domain.com"
```

### Povezivanje statičkog sajta sa upload endpointom

Prije učitavanja `script.js`, deploy proces može da injectuje vrijednost iz `.env` fajla:

```html
<script>
  window.WEDDING_UPLOAD_ENDPOINT = "https://your-domain.com/api/upload";
  window.WEDDING_SITE_URL = "https://your-domain.com";
</script>
<script src="script.js" defer></script>
```

Ako koristite Vite, Netlify, Vercel ili sličan alat, mapirajte `.env` vrijednost `WEDDING_UPLOAD_ENDPOINT` u ovu globalnu JavaScript varijablu tokom build/deploy procesa.

### Očekivani upload endpoint

Sajt šalje `POST` request kao `multipart/form-data` sa jednim ili više polja naziva `files`:

```text
POST /api/upload
Content-Type: multipart/form-data
files: File[]
```

Backend treba da:

1. Provjeri dozvoljene ekstenzije: `jpg`, `jpeg`, `png`, `heic`, `mp4`, `mov`.
2. Provjeri da je svaki fajl manji ili jednak 50MB.
3. Uploaduje fajlove u folder definisan kroz `GOOGLE_DRIVE_FOLDER_ID`.
4. Vrati HTTP status `200` ili `201` nakon uspješnog upload-a.

## QR kod

QR kod se generiše automatski na osnovu URL-a sajta. Ako je definisan `window.WEDDING_SITE_URL`, koristi se ta vrijednost; u suprotnom se koristi trenutni URL stranice.

## Struktura fajlova

```text
index.html   # HTML struktura sajta
styles.css   # Luxury minimal responsive stilovi
script.js    # Upload logika, validacija, progress bar i QR kod
README.md    # Uputstvo za lokalno pokretanje i Google Drive integraciju
```
