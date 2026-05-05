import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politică de confidențialitate | ReziNOT",
  description: "Cum colectăm, folosim și protejăm datele dumneavoastră personale.",
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-28 pb-16 text-sm leading-relaxed text-white/80 sm:px-6 sm:pt-32">
      <h1 className="mb-2 text-balance text-2xl font-semibold text-white sm:text-3xl">Politică de confidențialitate</h1>
      <p className="mb-8 text-white/50">Ultima actualizare: mai 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="mb-2 text-lg font-medium text-white">1. Operatorul datelor</h2>
          <p>
            ReziNOT este operatorul datelor dumneavoastră personale, în conformitate cu
            Regulamentul (UE) 2016/679 (GDPR).
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">2. Date colectate</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>Nume și adresă de email (la creare cont)</li>
            <li>Parolă (stocată hash-uită cu bcrypt, niciodată în clar)</li>
            <li>Date despre activitate: răspunsuri la grile, scoruri, statistici de progres</li>
            <li>Date de plată: gestionate exclusiv de Stripe — nu stocăm carduri</li>
            <li>Cookie-uri de sesiune și autentificare</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">3. Scopul prelucrării</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>Furnizarea serviciului educațional</li>
            <li>Gestionarea abonamentelor și plăților</li>
            <li>Generarea statisticilor personale și comparațiilor anonime cu alți utilizatori</li>
            <li>Comunicări legate de cont (email tranzacțional)</li>
            <li>Îmbunătățirea platformei</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">4. Temei legal</h2>
          <p>
            Prelucrăm datele pe baza executării contractului (termenii serviciului), a
            consimțământului dumneavoastră, și a obligațiilor legale (facturare, evidență
            contabilă).
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">5. Procesatori terți</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Stripe</strong> — procesare plăți și gestionare abonamente</li>
            <li><strong>Railway</strong> — infrastructură cloud și baza de date</li>
            <li><strong>Resend</strong> — email tranzacțional (resetare parolă, confirmări, notificări)</li>
            <li><strong>Google</strong> — autentificare opțională prin OAuth</li>
            <li><strong>Upstash</strong> — limitarea ratei (rate limiting)</li>
          </ul>
          <p className="mt-2">
            Toți procesatorii sunt obligați contractual să respecte GDPR.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">6. Perioada de păstrare</h2>
          <p>
            Datele de cont sunt păstrate pe durata existenței contului. Datele de facturare se
            păstrează conform obligațiilor legale (10 ani). La ștergerea contului, datele
            personale sunt șterse sau anonimizate, exceptând cele necesare obligațiilor legale.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">7. Drepturile dumneavoastră</h2>
          <p>Conform GDPR, aveți dreptul la:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <strong>Acces și portabilitate</strong> — în pagina{" "}
              <em>Profil &rarr; Cont și date</em> puteți descărca un fișier
              JSON cu toate datele asociate contului.
            </li>
            <li>
              <strong>Rectificare</strong> — datele profilului (nume, email, an
              de studiu, obiective) se pot edita oricând în <em>Profil</em>. Pentru
              email se trimite un link de confirmare la noua adresă.
            </li>
            <li>
              <strong>Ștergere („dreptul de a fi uitat”)</strong> — butonul{" "}
              <em>Șterge contul</em> din <em>Profil &rarr; Cont și date</em> șterge
              definitiv contul și toate datele asociate (sesiuni, răspunsuri,
              abonament). Dacă există un abonament activ, este anulat imediat.
            </li>
            <li>
              <strong>Retragerea consimțământului</strong> — bifa de marketing
              se poate dezactiva oricând din <em>Profil &rarr; Preferinte</em>.
              Stocăm momentul în care a fost dat consimțământul pentru audit.
            </li>
            <li>Restricționarea prelucrării</li>
            <li>Opoziție</li>
            <li>Plângere la ANSPDCP</li>
          </ul>
          <p className="mt-2">
            Pentru întrebări sau cereri suplimentare, contactați-ne la{" "}
            <a
              href="mailto:support@grile-rezinote.ro"
              className="text-emerald-400 underline-offset-2 hover:underline"
            >
              support@grile-rezinote.ro
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">8. Securitate</h2>
          <p>
            Folosim măsuri tehnice și organizatorice (HTTPS, hash-uirea parolelor, control de
            acces, audit log-uri) pentru a proteja datele dumneavoastră. Cu toate acestea, nicio
            metodă de transmitere prin internet nu este 100% sigură.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">9. Cookie-uri</h2>
          <p>
            Folosim exclusiv cookie-uri strict necesare pentru funcționarea
            platformei: cookie-ul de sesiune NextAuth (autentificare),
            preferințe de temă (light/dark) și protecție CSRF. Nu folosim
            cookie-uri de analytics, tracking sau publicitate, și nu împărtășim
            date cu terți pentru profilare.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">10. Modificări</h2>
          <p>
            Această politică poate fi actualizată. Modificările vor fi anunțate pe email
            utilizatorilor înregistrați.
          </p>
        </div>
      </section>
    </main>
  )
}
