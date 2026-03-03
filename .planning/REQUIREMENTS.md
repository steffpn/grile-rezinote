# Requirements: grile-ReziNOTE

**Defined:** 2026-03-02
**Core Value:** Studentii pot simula examene reale de rezidentiat si vedea instant daca ar fi fost admisi si unde, pe baza datelor istorice reale.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Branding & Landing Page

- [ ] **BRAND-01**: Branding complet: logo, paleta de culori, fonturi — profesional dar friendly, credibil si accesibil pentru studenti
- [ ] **BRAND-02**: Landing page de prezentare cu value proposition clara, call-to-action signup, sectiuni explicative despre functionalitati
- [ ] **BRAND-03**: Design system consistent aplicat pe toata platforma (butoane, carduri, tipografie, culori, spacing)

### Autentificare

- [ ] **AUTH-01**: User poate crea cont cu email si parola
- [ ] **AUTH-02**: User primeste email de verificare dupa inregistrare
- [ ] **AUTH-03**: User poate reseta parola prin link pe email
- [ ] **AUTH-04**: Sesiunea user-ului persista dupa refresh browser
- [ ] **AUTH-05**: User poate face logout de pe orice pagina

### Admin - Gestionare Continut

- [x] **ADMN-01**: Admin poate crea, edita si sterge capitole (nume, descriere, ordine)
- [x] **ADMN-02**: Admin poate crea grile cu: intrebare, optiuni de raspuns (A-E), tip CS/CM, raspuns(uri) corect(e), sursa (carte/pagina)
- [x] **ADMN-03**: Admin poate edita si sterge grile existente
- [x] **ADMN-04**: Admin poate importa grile in bulk din fisiere CSV si Excel (cu validare si raport de erori)
- [x] **ADMN-05**: Admin poate exporta grile in format CSV si Excel
- [ ] **ADMN-06**: Admin poate gestiona date istorice de admitere: praguri per specialitate per an, numar locuri
- [x] **ADMN-07**: Admin panel securizat doar pentru superadmin

### Teste Practice

- [ ] **TEST-01**: User poate incepe test pe un capitol individual (fara limita de timp)
- [ ] **TEST-02**: User poate incepe test amestecat din toate capitolele (fara limita de timp)
- [ ] **TEST-03**: User poate alege inainte de test daca vede raspunsul corect imediat dupa fiecare intrebare sau la final
- [ ] **TEST-04**: User vede sursa/referinta carte dupa ce i se arata raspunsul corect
- [ ] **TEST-05**: User poate revizui intrebarile la care a gresit anterior (mod review intrebari gresite)

### Simulare Examen

- [ ] **EXAM-01**: User poate incepe simulare de examen: 200 intrebari (primele 50 CS, urmatoarele 150 CM), random din toate capitolele
- [ ] **EXAM-02**: Simularea are timer countdown cu durata configurabila din admin (default 4 ore)
- [ ] **EXAM-03**: La simulare, user-ul vede rezultatele doar la final (nu pe parcurs)
- [ ] **EXAM-04**: Scoring-ul foloseste formula oficiala romaneasca: punctaj per-optiune pentru CM (1 punct per optiune corecta selectata SAU optiune gresita neselectata), cu anulare la sub 2 sau peste 4 selectii
- [ ] **EXAM-05**: Raspunsurile se salveaza progresiv (dupa fiecare intrebare) pentru a preveni pierderea datelor
- [ ] **EXAM-06**: Timer-ul e server-authoritative (serverul valideaza durata, clientul doar afiseaza)

### Comparatie Admitere

- [ ] **COMP-01**: Dupa simulare, user-ul vede scorul total obtinut
- [ ] **COMP-02**: Platforma afiseaza istoric praguri admitere pe ultimii 5 ani per specialitate
- [ ] **COMP-03**: Platforma indica la ce specialitati ar fi fost admis user-ul si unde ar fi intrat, bazat pe scorul obtinut vs pragurile istorice
- [ ] **COMP-04**: User poate explora datele istorice de admitere independent (browser interactiv)

### Dashboard & Analytics

- [ ] **DASH-01**: User vede dashboard principal cu statistici generale (acuratete totala, intrebari completate, teste finalizate)
- [ ] **DASH-02**: User vede statistici detaliate per capitol (acuratete, intrebari incercate, progres)
- [ ] **DASH-03**: User vede trend/progres pe zile si saptamani (grafice de evolutie)
- [ ] **DASH-04**: User vede istoric intrebari corecte si gresite cu detalii
- [ ] **DASH-05**: Dashboard-ul are vizualizari avansate: radar chart per capitol, heat map zone slabe, sparklines pentru trend
- [ ] **DASH-06**: Statisticile se actualizeaza dinamic dupa fiecare test completat

### Comparatie Anonima

- [x] **PEER-01**: User vede percentila sa (top X%) din toti utilizatorii care au facut simulare completa
- [x] **PEER-02**: User vede grafic distributie scoruri (curba cu pozitia sa evidentiata)
- [x] **PEER-03**: User vede media si mediana scorurilor celorlalti utilizatori vs scorul propriu
- [x] **PEER-04**: User vede ranking anonim (locul X din Y participanti), fara nume afisate
- [x] **PEER-05**: Comparatia include doar utilizatori care au completat simularea integrala

### Sistem Motivational

- [x] **MOTV-01**: Dashboard-ul afiseaza mesaje de incurajare auto-generate cand user-ul completeaza corect teste
- [x] **MOTV-02**: Dashboard-ul afiseaza mesaje motivationale cand user-ul are capitole la care trebuie sa mai invete
- [x] **MOTV-03**: Dashboard-ul afiseaza "stiai ca"-uri rotative si statistici interesante despre grile si performanta
- [x] **MOTV-04**: Mesajele sunt contextuale, bazate pe performanta reala (trend, milestone-uri, comparatii personale)

### Plati

- [ ] **PAY-01**: User poate vedea planurile de subscriptie (lunar si anual) cu preturi
- [ ] **PAY-02**: User poate plati subscriptie prin Stripe
- [ ] **PAY-03**: Accesul la continut se bazeaza pe starea subscriptiei (trial gratuit X zile, apoi plata)
- [ ] **PAY-04**: User poate anula/modifica subscriptia
- [ ] **PAY-05**: Sistem de webhooks idempotent pentru sincronizarea starii subscriptiei cu Stripe

### PWA & Mobile

- [ ] **PWA-01**: Platforma e instalabila ca PWA din browser (home screen icon, splash screen)
- [ ] **PWA-02**: Interfata e complet responsive si functionala pe mobil
- [ ] **PWA-03**: App shell-ul se cacheaza pentru incarcare rapida

### Limba & Localizare

- [ ] **LANG-01**: Toata interfata e in limba romana, cu suport corect pentru diacritice (s, t, a, a, i)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication Enhancements

- **AUTH-V2-01**: Login cu Google (OAuth)
- **AUTH-V2-02**: Two-factor authentication

### PWA Enhancements

- **PWA-V2-01**: Quiz-taking offline cu sincronizare (IndexedDB + sync)
- **PWA-V2-02**: Push notifications (streak reminders, mesaje motivationale)

### Admin Enhancements

- **ADMN-V2-01**: Versionare intrebari cu audit trail (istoric modificari)
- **ADMN-V2-02**: Multiple roluri admin (superadmin, editor, viewer)

### Expansion

- **EXPN-V2-01**: Multi-domeniu: medicina generala, farmacie (nu doar dentara)
- **EXPN-V2-02**: API pentru integrari externe

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app nativ (iOS/Android) | PWA acopera nevoile mobile; cost dublu de dezvoltare |
| AI-generated explanations | Risc de informatii incorecte in domeniul medical; sursa/cartea e mai de incredere |
| Forum / chat real-time | Overhead de moderare masiv; extern pe Discord/Telegram |
| Video lessons / tutoriale | Alt tip de continut, alt business; focus pe grile si simulari |
| Flashcards / spaced repetition | Produs separat; "review intrebari gresite" acopera nevoia |
| User-generated content | Risc calitate; acuratete medicala necesita admin-only |
| Gamification badges/levels | Poate parea patronizing pentru studenti adulti; mesajele motivationale + ranking acopera motivatia |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-01 | Phase 2 | Pending |
| BRAND-02 | Phase 2 | Pending |
| BRAND-03 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| ADMN-01 | Phase 3 | Complete |
| ADMN-02 | Phase 3 | Complete |
| ADMN-03 | Phase 3 | Complete |
| ADMN-04 | Phase 3 | Complete |
| ADMN-05 | Phase 3 | Complete |
| ADMN-06 | Phase 6 | Pending |
| ADMN-07 | Phase 3 | Complete |
| TEST-01 | Phase 4 | Pending |
| TEST-02 | Phase 4 | Pending |
| TEST-03 | Phase 4 | Pending |
| TEST-04 | Phase 4 | Pending |
| TEST-05 | Phase 4 | Pending |
| EXAM-01 | Phase 5 | Pending |
| EXAM-02 | Phase 5 | Pending |
| EXAM-03 | Phase 5 | Pending |
| EXAM-04 | Phase 5 | Pending |
| EXAM-05 | Phase 5 | Pending |
| EXAM-06 | Phase 5 | Pending |
| COMP-01 | Phase 6 | Pending |
| COMP-02 | Phase 6 | Pending |
| COMP-03 | Phase 6 | Pending |
| COMP-04 | Phase 6 | Pending |
| DASH-01 | Phase 7 | Pending |
| DASH-02 | Phase 7 | Pending |
| DASH-03 | Phase 7 | Pending |
| DASH-04 | Phase 7 | Pending |
| DASH-05 | Phase 7 | Pending |
| DASH-06 | Phase 7 | Pending |
| PEER-01 | Phase 8 | Complete |
| PEER-02 | Phase 8 | Complete |
| PEER-03 | Phase 8 | Complete |
| PEER-04 | Phase 8 | Complete |
| PEER-05 | Phase 8 | Complete |
| MOTV-01 | Phase 8 | Complete |
| MOTV-02 | Phase 8 | Complete |
| MOTV-03 | Phase 8 | Complete |
| MOTV-04 | Phase 8 | Complete |
| PAY-01 | Phase 9 | Pending |
| PAY-02 | Phase 9 | Pending |
| PAY-03 | Phase 9 | Pending |
| PAY-04 | Phase 9 | Pending |
| PAY-05 | Phase 9 | Pending |
| PWA-01 | Phase 10 | Pending |
| PWA-02 | Phase 10 | Pending |
| PWA-03 | Phase 1 | Pending |
| LANG-01 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 54 total
- Mapped to phases: 54
- Unmapped: 0

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after roadmap creation*
