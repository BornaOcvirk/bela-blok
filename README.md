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

## Sigurnosna kopija
Podaci su samo na mobitelu. **Povijest → Sigurnosna kopija → Izvezi** povremeno.

## Razvoj
- `docs/` – cijela aplikacija (HTML/JS, bez build koraka); služi i za GitHub Pages i za iOS app.
- `docs/bela.js` – pravila bodovanja · `npm test` – provjera.
- `make-icon.js` – generira ikone · `.github/workflows/ios.yml` – gradi .ipa na macOS runneru (Capacitor).
