# CodeAnalyst - AI Svetainių ir Kodo Analizės Platforma

## Projekto Apžvalga

CodeAnalyst yra išsami AI analizės platforma, skirta MVĮ sektorių įmonėms analizuoti, optimizuoti ir prižiūrėti savo svetaines bei kodo saugyklas. Platforma teikia realaus laiko įžvalgas naudojant keletą AI tiekėjų ir pažangius analizės įrankius.

**Dabartinis statusas**: KŪRIMO/TESTAVIMO FAZĖ
**Diegimas**: Vercel (Frontend) + Lokalus Backend su ngrok
**Frontend URL**: https://analyst-psi.vercel.app
**Backend**: Lokalus serveris su ngrok tuneliu

## Architektūra

### Frontend Technologijos
- React 18 su TypeScript
- Vite build sistema
- React Router navigacijai
- Zustand būsenos valdymui
- Tailwind CSS stilizavimui
- Heroicons piktogramoms
- React Hot Toast pranešimams
- PDF eksporto funkcionalumas (jsPDF + html2canvas)

### Backend Technologijos
- Node.js 18+ su Express.js
- PostgreSQL duomenų bazė
- Redis talpyklai ir darbo eilėms
- JWT autentifikacija
- Bull darbo eilių sistema
- Puppeteer svetainių skenavimui
- Lighthouse veiklos analizei
- Pa11y prieinamumo testavimui

### AI Integracija
- OpenAI (GPT-4) - Vartotojo pasirenkama opcija
- Anthropic Claude - Vartotojo pasirenkama opcija
- Google Gemini (integracija paruošta, neįgyvendinta)
- Atsakymų talpyklos sistema
- Vartotojas gali pasirinkti AI tiekėją

## Pagrindiniai Moduliai

### 1. AI Kodo Analitikas
**Statusas**: VISIŠKAI FUNKCIONUOJA

**Ką daro**:
- Analizuoja GitHub saugyklas ir ZIP failus
- Atlieka gilų kodo bazių struktūrinį analizavimą
- Aptinka karkasus ir technologijų rinkinius
- Identifikuoja saugumo pažeidžiamumus
- Apskaičiuoja kodo kokybės rodiklius
- Įvertina techninę skolą
- Teikia AI paremtus tobulinimo pasiūlymus

**Kaip veikia**:
- GitHub saugyklų klonavimas per API
- Failų turinio analizė naudojant regex šablonus
- Priklausomybių grafiko sudarymas
- Saugumo šablonų atpažinimas
- AI analizė naudojant struktūrizuotus užklausos šablonus
- Išsami vertinimo sistema

**Palaikomos kalbos**: JavaScript, TypeScript, Python, Java, C/C++, C#, PHP, Ruby, Go, Rust, Swift, Kotlin, HTML, CSS, YAML, JSON

### 2. AI Svetainės Analitikas
**Statusas**: VISIŠKAI FUNKCIONUOJA

**Ką daro**:
- Išsami svetainės veiklos analizė
- SEO optimizavimo rekomendacijos
- Prieinamumo testavimas (WCAG atitikimas)
- Saugumo antraščių analizė
- Technologijų rinkinio aptikimas
- Core Web Vitals matavimas

**Kaip veikia**:
- Puppeteer turinio ištraukimas
- Lighthouse veiklos auditas
- Pa11y prieinamumo skenavimas
- Wappalyzer technologijų aptikimas
- Daugiamatis vertinimo sistema
- AI generuojamos optimizavimo įžvalgos

**Analizės sritys**:
- Veikla (Core Web Vitals, krovimo greitis)
- SEO (meta žymos, turinio kokybė, techninis SEO)
- Prieinamumas (WCAG atitikimas, ekrano skaitytuvų suderinamumas)
- Saugumas (antraštės, SSL, pažeidžiamumai)
- Vartotojo patirtis (mobilus pritaikomumas, navigacija)

### 3. AI Turinio Analitikas
**Statusas**: FUNKCIONUOJA (Bazinis įgyvendinimas)

**Ką daro**:
- Turinio kokybės vertinimas
- Gramatikos ir skaitomumo analizė
- SEO turinio optimizavimas
- Raktažodžių tankio analizė
- Turinio struktūros vertinimas

### 4. AI Auto Programuotojas
**Statusas**: VISIŠKAI FUNKCIONUOJA

**Ką daro**:
- Pokalbių paremti funkcijų užklausimai
- Automatinis kodo generavimas
- GitHub saugyklų integracija
- Failų struktūros analizė
- Interaktyvus AI kodavimo asistentas

**Kaip veikia**:
- Realaus laiko pokalbių sąsaja
- GitHub saugyklų pasirinkimas
- Failų turinio gavimas per API
- AI paremti kodo pasiūlymai
- Konteksto suvokiantis programavimo asistentas

### 5. AI Turinio Kūrėjas
**Statusas**: FUNKCIONUOJA (Bazinis įgyvendinimas)

**Ką daro**:
- SEO optimizuoto turinio generavimas
- Daugiakalbis turinio palaikymas
- Turinio struktūros šablonai
- Rinkodaros tekstų kūrimas

## Autentifikacija ir Saugumas

### GitHub OAuth Integracija
**Statusas**: VISIŠKAI FUNKCIONUOJA

**Funkcijos**:
- GitHub OAuth 2.0 autentifikacija
- Vartotojo avataro rodymas
- Saugyklų prieigos leidimai
- Saugus JWT tokenų valdymas
- Tikri vartotojo profilio duomenys (vardas, el. paštas, avataras)

**Saugumo priemonės**:
- JWT tokenų validacija
- CORS apsauga
- Užklausų dažnio ribojimas
- Saugių antraščių konfigūracija
- Aplinkos kintamųjų apsauga

## Duomenų bazės schema

### Pagrindinės lentelės
- **users**: Vartotojų paskyros ir GitHub integracija
- **analyses**: Analizės rezultatai ir metaduomenys
- **website_analyses**: Svetainės specifiniai analizės duomenys
- **ai_responses**: Talpyklos AI atsakymai veiklos optimizavimui
- **repositories**: GitHub saugyklų metaduomenys

### Duomenų srautas
1. Vartotojas autentifikuojasi per GitHub OAuth
2. Analizės užklausos patenka į eilę per Redis/Bull
3. Rezultatai saugomi PostgreSQL
4. AI atsakymai talpinami efektyvumui
5. Realaus laiko atnaujinimai per WebSocket (planuojama)

## Analizės procesas

### Svetainės analizės srautas
1. URL validacija ir normalizacija
2. Lygiagretusis analizės įrankių vykdymas:
   - Puppeteer turinio ištraukimas
   - Lighthouse veiklos auditas
   - Pa11y prieinamumo skenavimas
   - Saugumo antraščių analizė
   - Technologijų aptikimas
3. AI surinktų duomenų analizė
4. Balų skaičiavimas ir rekomendacijų generavimas
5. Rezultatų saugojimas ir vartotojo informavimas

### Kodo analizės srautas
1. Saugyklos prieiga (GitHub API arba ZIP įkėlimas)
2. Failų sistemos skenavimas ir filtravimas
3. Turinio analizė pagal failų tipą:
   - Karkasų aptikimas
   - Saugumo pažeidžiamumų skenavimas
   - Kodo kokybės vertinimas
   - Priklausomybių analizė
4. AI paremtų įžvalgų generavimas
5. Techninės skolos skaičiavimas
6. Verslo poveikio vertinimas

## AI analizės variklis

### Kelių tiekėjų palaikymas
- OpenAI GPT-4 (vartotojo pasirenkamas)
- Anthropic Claude (vartotojo pasirenkamas)
- Google Gemini (neįgyvendintas)
- Vartotojas pasirenka pageidaujamą tiekėją
- Atsakymų talpykla veiklos optimizavimui

### Analizės tipai
- Techninė analizė (kodo kokybė, veikla, saugumas)
- Verslo analizė (vartotojo patirtis, konversijų optimizavimas)
- Mišri analizė (išsamios įžvalgos)
- Individualūs analizės profiliai

### Užklausų inžinerija
- Struktūrizuoti šablonai nuosekliems rezultatams
- Konteksto suvokiančios analizės užklausos
- Srities specifinis optimizavimas
- Rezultatų validacija ir formatavimas

## Veiklos funkcijos

### Talpyklos sistema
- AI atsakymų talpykla (Redis)
- Duomenų bazės užklausų optimizavimas
- Statinių išteklių optimizavimas
- CDN integracija (Vercel)

### Fono apdorojimas
- Redis darbo eilės
- Asinchroninis analizės vykdymas
- Progreso sekimas
- Klaidų tvarkymas ir pakartojimo logika

## Eksportas ir ataskaitos

### PDF eksportas
**Statusas**: VISIŠKAI FUNKCIONUOJA
- Profesionalių ataskaitų generavimas
- Diagramų ir grafikų įtraukimas
- Individualaus prekės ženklo palaikymas
- Aukštos kokybės formatavimas

### Duomenų formatai
- JSON eksportas API integracijai
- CSV eksportas skaičiuoklių analizei
- PDF ataskaitos prezentacijoms
- Realaus laiko informacijos skydai

## Diegimo architektūra

### Frontend (Vercel)
- Automatinis diegimas iš Git
- Globalus CDN paskirstymas
- Aplinkos kintamųjų valdymas
- Individualių domenų palaikymas

### Backend (Lokalus + ngrok)
- Lokalus kūrimo serveris
- ngrok tunelis išorinei prieigai
- PostgreSQL duomenų bazė
- Redis talpykla ir eilės

### Konfigūracija
- Aplinkos paremti nustatymai
- API raktų valdymas
- Duomenų bazės ryšių telkinys
- CORS ir saugumo antraštės

## Dabartiniai apribojimai

1. **Backend hostingas**: Šiuo metu lokalus kūrimo nustatymas, reikia debesijos diegimo produkciniam mastui
2. **Realaus laiko atnaujinimai**: WebSocket įgyvendinimas planuojamas, bet dar neįgyvendintas
3. **Google Gemini**: Integracija paruošta, bet pilnai neįgyvendinta
4. **Pažangi analitika**: Informacijos skydo rodikliai ir istorinės analizės tendencijos planuojamos
5. **Daugiakalbis palaikymas**: UI šiuo metu tik anglų kalba

## Paskutiniai pasiekimai

1. ✅ Sėkmingas Vercel diegimas su tinkamu maršrutu
2. ✅ GitHub OAuth integracija su avataro palaikymu
3. ✅ ngrok integracija lokalaus backend prieigai
4. ✅ Išsamūs AI analizės moduliai
5. ✅ Profesionalus PDF eksporto funkcionalumas
6. ✅ Realaus laiko klaidų tvarkymas ir vartotojo grįžtamasis ryšys
7. ✅ Atsakingas UI dizainas
8. ✅ Fono darbo apdorojimas
9. ✅ Kelių tiekėjų AI integracija
10. ✅ Saugus autentifikacijos srautas

## Technologijų stiprybės

### Kodo kokybė
- TypeScript tipo saugumui
- Išsamūs klaidų apribojmai
- Struktūrizuota žurnalų sistema
- Profesionalus UI/UX dizainas
- Mobilus atsakingas išdėstymas

### Mastabuojamumas
- Modulinė architektūra
- Duomenų bazės ryšių telkinys
- Talpyklos sluoksniai
- Fono darbo apdorojimas
- API pirmasis dizainas

### Patikimumas
- Klaidų tvarkymas visur
- Atsarginės sistemos AI gedimams
- Duomenų validacija ir valymas
- Saugi autentifikacija
- Veiklos stebėjimas

 