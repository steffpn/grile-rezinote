import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Termeni și condiții | ReziNOT",
  description: "Termenii și condițiile de utilizare ale platformei ReziNOT.",
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-sm leading-relaxed text-white/80">
      <h1 className="mb-2 text-3xl font-semibold text-white">Termeni și condiții</h1>
      <p className="mb-8 text-white/50">Ultima actualizare: aprilie 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="mb-2 text-lg font-medium text-white">1. Acceptarea termenilor</h2>
          <p>
            Prin crearea unui cont și utilizarea platformei ReziNOT, sunteți de acord cu acești
            termeni. Dacă nu sunteți de acord, vă rugăm să nu folosiți serviciul.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">2. Descrierea serviciului</h2>
          <p>
            ReziNOT este o platformă educațională online destinată pregătirii pentru rezidențiat
            în medicină. Serviciul oferă acces la grile, simulări de examene, statistici și
            instrumente de studiu, contra unui abonament lunar sau anual.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">3. Cont de utilizator</h2>
          <p>
            Sunteți responsabil pentru păstrarea confidențialității datelor de autentificare și
            pentru toate activitățile efectuate prin contul dumneavoastră. Anunțați-ne imediat
            dacă suspectați acces neautorizat.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">4. Perioadă de probă și plată</h2>
          <p>
            Oferim o perioadă de probă gratuită. La final, accesul la conținut premium necesită
            un abonament activ. Plățile sunt procesate prin Stripe. Puteți anula abonamentul în
            orice moment din contul dumneavoastră.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">5. Proprietate intelectuală</h2>
          <p>
            Conținutul (grile, explicații, materiale) este proprietatea ReziNOT sau a partenerilor
            și este protejat de legislația privind drepturile de autor. Este interzisă copierea,
            distribuirea sau republicarea fără acord scris.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">6. Conduită utilizator</h2>
          <p>
            Vă obligați să nu încercați să ocoliți măsurile de securitate, să nu partajați contul
            cu terți și să nu utilizați platforma în scopuri ilegale sau care încalcă drepturile
            altora.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">7. Limitarea răspunderii</h2>
          <p>
            ReziNOT oferă serviciul „așa cum este”. Nu garantăm că platforma va fi disponibilă
            neîntrerupt sau lipsită de erori. În măsura permisă de lege, nu suntem răspunzători
            pentru pierderi indirecte rezultate din utilizarea serviciului.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">8. Modificări</h2>
          <p>
            Ne rezervăm dreptul de a actualiza acești termeni. Schimbările semnificative vor fi
            comunicate utilizatorilor înregistrați pe email.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-medium text-white">9. Contact</h2>
          <p>
            Pentru întrebări legate de acești termeni, ne puteți contacta la adresa de email
            indicată în secțiunea de suport a platformei.
          </p>
        </div>
      </section>
    </main>
  )
}
