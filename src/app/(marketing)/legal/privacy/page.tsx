import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politică de confidențialitate | ReziNOT",
  description: "Cum colectăm, folosim și protejăm datele dumneavoastră personale.",
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-sm leading-relaxed text-white/80">
      <h1 className="mb-2 text-3xl font-semibold text-white">Politică de confidențialitate</h1>
      <p className="mb-8 text-white/50">Ultima actualizare: aprilie 2026</p>

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
            <li><strong>Stripe</strong> — procesare plăți</li>
            <li>Furnizor hosting (infrastructură cloud)</li>
            <li>Furnizor email tranzacțional</li>
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
            <li>Acces la datele personale</li>
            <li>Rectificare</li>
            <li>Ștergere („dreptul de a fi uitat”)</li>
            <li>Restricționarea prelucrării</li>
            <li>Portabilitate</li>
            <li>Opoziție</li>
            <li>Plângere la ANSPDCP</li>
          </ul>
          <p className="mt-2">
            Pentru exercitarea acestor drepturi, contactați-ne prin secțiunea de suport.
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
            Folosim cookie-uri esențiale pentru autentificare și funcționarea platformei. Nu
            folosim cookie-uri de tracking publicitar.
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
