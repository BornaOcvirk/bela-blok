# ♣ Bela Blok

Bilježnica za belu: bodovi po rukama, zvanja (20/50/100/150/200), bela, štiglja, belot, pad,
igrači koji se miješaju u parove i statistika po igraču. Svijetla i tamna tema (šumsko zelena).

## Instalacija na iPhone

### A) Prava aplikacija (.ipa) – besplatno, bez Maca
1. Preuzmi **BelaBlok.ipa** s [Releases → app](../../releases/tag/app)
   (GitHub ga automatski gradi na svaki push).
2. Na Windows računalo instaliraj **iTunes** (verzija s apple.com, ne iz Microsoft Storea) i **[Sideloadly](https://sideloadly.io)**.
3. Spoji iPhone kablom, otvori Sideloadly, ubaci `BelaBlok.ipa`, upiši svoj Apple ID → **Start**.
4. Na iPhoneu: **Postavke → Privatnost i sigurnost → Način rada za razvojne programere** → uključi (traži restart).
5. **Postavke → Općenito → Upravljanje VPN-om i uređajem** → tvoj Apple ID → **Vjeruj**.

> S besplatnim Apple ID-jem aplikacija radi 7 dana, onda je ponovno instaliraj u Sideloadlyju
> (podaci ostaju). S Apple Developer računom (99 $/god.) traje godinu dana.

### B) Web aplikacija – najbrže
1. Na GitHubu: **Settings → Pages → Branch: `main`, folder: `/docs` → Save**.
2. Na iPhoneu u Safariju otvori `https://bornaocvirk.github.io/bela-blok/`.
3. **Dijeli → Dodaj na početni zaslon**. Radi i bez interneta, ne istječe.

## Instalacija na Android
1. Na mobitelu preuzmi **BelaBlok.apk** s [Releases → android](../../releases/tag/android) (gradi se na svaki push).
2. Otvori ga i dopusti instalaciju iz nepoznatih izvora. Nova verzija se instalira preko stare, podaci ostaju.

> Gradnja treba tajni ključ: **Settings → Secrets and variables → Actions → `ANDROID_KEYSTORE`** = base64 od
> `android-signing.keystore` (čuva se samo lokalno, nije u gitu – ako se izgubi, sljedeća verzija traži deinstalaciju).

## Račun (nije obavezan)
Sve radi i bez računa. Račun samo dodaje oblak: tko se registrira, dobije korisničko ime, a kad ga netko na svom
mobitelu poveže s igračem (**Igrači → ☁ → korisničko ime**), završene igre tog igrača šalju se u oblak.
U **prijava / ime** (gore lijevo) svatko vidi svoju statistiku iz igara sa svih mobitela.
Nakon registracije treba potvrditi e-mail (poveznica u e-mailu); tek tada se igre šalju u oblak.
Račun se briše u **Račun → Obriši račun** (briše i igre koje si poslao).
Igre odigrane bez interneta pošalju se same kad se veza vrati. Za slanje igara mora biti prijavljen onaj tko vodi zapisnik.

### Postavljanje (jednom, besplatno)
1. [console.firebase.google.com](https://console.firebase.google.com) → **Create project** (Analytics nije potreban).
2. **Build → Authentication → Get started → Email/Password → Enable**.
3. **Build → Firestore Database → Create database** (production mode, bilo koja lokacija u EU).
4. **Firestore → Rules**: zalijepi sadržaj datoteke `firestore.rules` → **Publish**.
5. **Project settings → General → Your apps → Web (</>)**: registriraj app pa kopiraj `apiKey` i `projectId`
   u `const FB = { apiKey: '…', project: '…' }` u `docs/index.html`. (apiKey je javan po dizajnu; podatke štite pravila.)

Dok je `apiKey` prazan, aplikacija ne prikazuje ništa vezano uz račune.

## Sigurnosna kopija
Podaci su samo na mobitelu. **Povijest → Sigurnosna kopija → Izvezi** povremeno.

## Razvoj
- `docs/` – cijela aplikacija (HTML/JS, bez build koraka); služi i za GitHub Pages i za iOS app.
- `docs/bela.js` – pravila bodovanja · `npm test` – provjera.
- `make-icon.js` – generira ikone · `.github/workflows/ios.yml` – gradi .ipa na macOS runneru (Capacitor).
