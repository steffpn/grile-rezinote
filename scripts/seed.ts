/**
 * Seed script: populates chapters, specialties, admission data, and ~2000 questions.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires DATABASE_URL in .env (or .env.local)
 */

import "dotenv/config"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import {
  chapters,
  questions,
  options,
  specialties,
  admissionData,
} from "../src/lib/db/schema"

// ─── DB connection ───────────────────────────────────────────────────────────

const url = process.env.DATABASE_URL
if (!url) {
  console.error("❌  DATABASE_URL is not set. Add it to .env and retry.")
  process.exit(1)
}

const client = postgres(url, { prepare: false })
const db = drizzle(client)

// ─── Chapter definitions ────────────────────────────────────────────────────

const CHAPTERS = [
  {
    name: "Aparatul dento-maxilar",
    description:
      "Anatomia și fiziologia aparatului dento-maxilar, oase, mușchi, articulații",
    sourceBook: "Boboc - Aparatul dento-maxilar",
    concepts: [
      "mandibula",
      "maxilarul",
      "articulația temporomandibulară",
      "mușchii masticatori",
      "nervul trigemen",
      "glandele salivare",
      "osul temporal",
      "fosa infratemporală",
      "foramenul mentonier",
      "tuberculul articular",
      "discul articular",
      "ligamentele ATM",
      "mușchiul pterigoidian lateral",
      "mușchiul pterigoidian medial",
      "mușchiul maseter",
      "mușchiul temporal",
      "ramul mandibulei",
      "procesul coronoid",
      "condilul mandibular",
      "tuberozitatea maxilară",
    ],
  },
  {
    name: "Pedodonție",
    description:
      "Stomatologia pediatrică: dentiția temporară, erupție, tratamente la copii",
    sourceBook: "Zarnea - Pedodonție",
    concepts: [
      "dentiția temporară",
      "erupția dentară",
      "caria de biberon",
      "pulpotomia",
      "pulpectomia la temporari",
      "sigilarea de șanțuri și fosete",
      "fluoroprofilaxia",
      "traumatismele dentare la copii",
      "menținătorul de spațiu",
      "coroana de oțel",
      "avulzia dentară la copii",
      "hipoplazia de smalț",
      "amelogeneza imperfectă",
      "dentinogeneza imperfectă",
      "resorbția fiziologică",
      "anchiloză la temporari",
      "dens in dente",
      "fuziunea dentară",
      "geminarea dentară",
      "dinte natal și neonatal",
    ],
  },
  {
    name: "Protetică dentară",
    description:
      "Proteze fixe și mobile, amprentare, aliaje, ceramică, design protetic",
    sourceBook: "Luca - Protetică dentară",
    concepts: [
      "proteza parțială mobilizabilă",
      "proteza totală",
      "coroana de înveliș",
      "puntea dentară",
      "bontul protetic",
      "amprentarea cu silicon",
      "amprentarea cu alginat",
      "croșetul turnat",
      "conectorul major",
      "conectorul minor",
      "placa bazală",
      "relația centrică",
      "dimensiunea verticală de ocluzie",
      "ghidajul anterior",
      "ocluzia echilibrată bilateral",
      "articulatorul semiadaptabil",
      "proba scheletului metalic",
      "ceramica dentară",
      "aliajele nobile",
      "cimentarea definitivă",
    ],
  },
  {
    name: "Odontoterapie restauratoare",
    description:
      "Cariologie, prepararea cavităților, materiale de restaurare directă",
    sourceBook: "Topoliceanu - Odontoterapie restauratoare",
    concepts: [
      "caria de smalț",
      "caria de dentină",
      "caria de cement",
      "clasificarea Black",
      "cavitatea clasa I",
      "cavitatea clasa II",
      "cavitatea clasa III",
      "cavitatea clasa IV",
      "cavitatea clasa V",
      "compozitul fotopolimerizabil",
      "ionomerul de sticlă",
      "amalgamul de argint",
      "adeziunea la smalț",
      "adeziunea la dentină",
      "tehnica acid-etch",
      "matricea și portmatricea",
      "coafajul direct",
      "coafajul indirect",
      "baza de ciment",
      "linerele cavitare",
    ],
  },
  {
    name: "Endodonție",
    description:
      "Patologia pulpei și periapicală, tratamentul de canal, instrumentar endodontic",
    sourceBook: "Fontana - Endodonție",
    concepts: [
      "pulpita acută",
      "pulpita cronică",
      "necroza pulpară",
      "parodontita apicală acută",
      "parodontita apicală cronică",
      "granulomul periapical",
      "abcesul periapical",
      "chistul radicular",
      "instrumentarul endodontic rotativ",
      "instrumentarul manual K-file",
      "tehnica crown-down",
      "tehnica step-back",
      "irigația cu hipoclorit de sodiu",
      "obturația cu gutapercă",
      "sigilatorul de canal",
      "lungimea de lucru",
      "localizatorul electronic de apex",
      "retratamentul endodontic",
      "perforația radiculară",
      "resorția internă",
    ],
  },
  {
    name: "Chirurgie orală",
    description:
      "Extracții, chirurgie dentoalveolară, patologie chirurgicală orală",
    sourceBook: "Grivu - Chirurgie orală",
    concepts: [
      "extracția simplă",
      "extracția chirurgicală",
      "molarul de minte inclus",
      "alveolita post-extractivă",
      "rezecția apicală",
      "chistul odontogen",
      "ameloblastomul",
      "odontomul",
      "fractura de mandibulă",
      "fractura de maxilar Le Fort",
      "sinusita maxilară odontogenă",
      "comunicarea oro-sinuzală",
      "anestezia tronculară",
      "anestezia infiltrativă",
      "hemostaza locală",
      "abcesul submandibular",
      "flegmonul planșeului bucal",
      "osteomielita mandibulară",
      "pericoronarita",
      "fibroza cicatriceală",
    ],
  },
  {
    name: "Parodontologie",
    description: "Boli parodontale, diagnostic și tratament parodontal",
    sourceBook: "Zetu - Parodontologie",
    concepts: [
      "gingivita cronică",
      "parodontita cronică",
      "parodontita agresivă",
      "recesia gingivală",
      "hiperplazia gingivală",
      "pungile parodontale",
      "pierderea de atașament clinic",
      "sondajul parodontal",
      "indexul de placă",
      "indexul gingival",
      "detartrajul supragingival",
      "detartrajul subgingival",
      "surfasarea radiculară",
      "chirurgia cu lambou",
      "regenerarea tisulară ghidată",
      "membranele de colagen",
      "grefa gingivală liberă",
      "grefa de țesut conjunctiv",
      "terapia parodontală de susținere",
      "mobilitatea dentară",
    ],
  },
  {
    name: "Reabilitare orală",
    description:
      "Implantologie, reconstrucție protetică pe implanturi, reabilitare complexă",
    sourceBook: "Forna - Reabilitare orală",
    concepts: [
      "implantul endoosos",
      "osteointegrarea",
      "bontul protetic pe implant",
      "proteza pe implanturi",
      "augmentarea osoasă",
      "sinus lifting",
      "grefa osoasă autogenă",
      "grefa osoasă alogenă",
      "membrana de colagen resorbabilă",
      "planificarea implantară digitală",
      "ghidul chirurgical",
      "implantul imediat post-extractiv",
      "încărcarea imediată",
      "periimplantita",
      "mucozita periimplantară",
      "protocolul All-on-4",
      "barul pe implanturi",
      "supraproteza",
      "conexiunea implant-bont",
      "torque-ul de inserție",
    ],
  },
  {
    name: "Ortodonție",
    description:
      "Anomalii dento-maxilare, aparate ortodontice, diagnostic și plan de tratament",
    sourceBook: "Căruntu - Ortodonție",
    concepts: [
      "malocluzia clasa I Angle",
      "malocluzia clasa II/1",
      "malocluzia clasa II/2",
      "malocluzia clasa III",
      "înghesuirea dentară",
      "diastema mediană",
      "ocluzia deschisă anterioară",
      "ocluzia adâncă acoperită",
      "ocluzia inversă",
      "prognația mandibulară",
      "retrognația mandibulară",
      "analiza cefalometrică",
      "aparatul fix multibracket",
      "aparatul mobil",
      "arcul ortodontic NiTi",
      "extractiile ortodontice",
      "contenția ortodontică",
      "aparatul funcțional",
      "distalarea molarilor",
      "expansiunea maxilară",
    ],
  },
  {
    name: "Anatomie și morfologie dentară",
    description:
      "Morfologia dinților, anatomia rădăcinilor, variații anatomice",
    sourceBook: "Platforma online",
    concepts: [
      "incisivul central superior",
      "incisivul lateral superior",
      "caninul superior",
      "premolarul I superior",
      "premolarul II superior",
      "molarul I superior",
      "molarul II superior",
      "molarul III superior",
      "incisivul central inferior",
      "caninul inferior",
      "premolarul I inferior",
      "premolarul II inferior",
      "molarul I inferior",
      "cuspizii dentari",
      "crestele marginale",
      "fosa centrală",
      "camera pulpară",
      "canalele radiculare",
      "foramenul apical",
      "cementul radicular",
    ],
  },
  {
    name: "Materiale dentare",
    description:
      "Proprietăți fizico-chimice, clasificare și utilizare materiale stomatologice",
    sourceBook: "Platforma online",
    concepts: [
      "compozitele dentare",
      "ceramica feldspată",
      "ceramica pe bază de zirconiu",
      "ionomerul de sticlă convențional",
      "ionomerul de sticlă modificat cu rășină",
      "amalgamul dentar",
      "aliajele de crom-cobalt",
      "aliajele de crom-nichel",
      "aliajele de aur",
      "rășinile acrilice",
      "cimenturile pe bază de zinc",
      "cimenturile de rășină",
      "siliconul de adiție",
      "siliconul de condensare",
      "alginatul",
      "ceara dentară",
      "ghipsul dentar",
      "adezivii dentari",
      "fibrele de sticlă",
      "compomerele",
    ],
  },
  {
    name: "Radiologie oro-maxilo-facială",
    description:
      "Radiografia dentară, panoramică, CBCT, interpretare imagistică",
    sourceBook: "Platforma online",
    concepts: [
      "radiografia retroalveolară",
      "radiografia panoramică",
      "radiografia ocluzală",
      "CBCT-ul dento-maxilar",
      "radiografia cefalometrică",
      "radiotransparența periapicală",
      "radiopacitatea",
      "lărgirea spațiului periodontal",
      "resorbția osoasă orizontală",
      "resorbția osoasă verticală",
      "chistul periapical pe radiografie",
      "granulomul pe radiografie",
      "fractura radiculară pe radiografie",
      "supranumerar pe radiografie",
      "incluzia dentară pe radiografie",
      "sinusul maxilar pe panoramică",
      "canalul mandibular pe panoramică",
      "foramenul mentonier pe radiografie",
      "protecția radiologică",
      "doza de radiație",
    ],
  },
]

// ─── Specialty definitions ──────────────────────────────────────────────────

const SPECIALTIES = [
  {
    name: "Chirurgie dento-alveolară",
    description: "Extracții, chirurgia leziunilor odontogene, traumatologie",
  },
  {
    name: "Chirurgie orală și maxilo-facială",
    description:
      "Chirurgia tumorilor, traumatologie facială, reconstrucție craniofacială",
  },
  {
    name: "Endodonție",
    description:
      "Tratamentul bolilor pulpare și periapicale, microchirurgie endodontică",
  },
  {
    name: "Ortodonție și ortopedie dento-facială",
    description:
      "Diagnostic și tratament anomalii dento-maxilare, aparate ortodontice",
  },
  {
    name: "Parodontologie",
    description:
      "Diagnostic și tratament boli parodontale, chirurgie muco-gingivală",
  },
  {
    name: "Pedodonție",
    description:
      "Stomatologia copilului și adolescentului, profilaxia cariei la copii",
  },
  {
    name: "Protetică dentară",
    description:
      "Proteze fixe și mobilizabile, reconstrucții ocluzale complexe",
  },
  {
    name: "Odontoterapie conservatoare",
    description: "Restaurări directe și indirecte, cariologie, estetică dentară",
  },
  {
    name: "Radiologie dento-maxilo-facială",
    description: "Imagistică orală: radiografie, CBCT, RM, interpretare",
  },
  {
    name: "Sănătate orală comunitară",
    description:
      "Epidemiologia bolilor orale, programe de profilaxie comunitară",
  },
  {
    name: "Medicină dentară preventivă",
    description:
      "Prevenția cariei, sigilări, fluorizare, educație pentru sănătate",
  },
  {
    name: "Implantologie orală",
    description:
      "Inserarea și protezarea pe implanturi, augmentare osoasă, sinus lift",
  },
  {
    name: "Estetică dentară",
    description:
      "Albire dentară, fațete, restaurări estetice, design digital al zâmbetului",
  },
  {
    name: "Gnatologie și ocluzie",
    description:
      "Disfuncții temporomandibulare, analiză ocluzală, echilibrare ocluzală",
  },
  {
    name: "Medicina de urgență stomatologică",
    description:
      "Urgențe: abces, hemoragie, traumatism, reacții alergice, sincopa",
  },
]

// ─── Question template system ───────────────────────────────────────────────

/** CS = single-choice (1 correct), CM = multiple-choice (2-3 correct) */

interface QuestionTemplate {
  stem: (concept: string) => string
  type: "CS" | "CM"
  /** generate 5 options, returning [label, text, isCorrect][] */
  makeOptions: (
    concept: string,
    idx: number,
    allConcepts: string[]
  ) => [string, string, boolean][]
}

// Utility: deterministic pick from array using index
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}
function pickN<T>(arr: T[], start: number, n: number): T[] {
  const result: T[] = []
  for (let j = 0; j < n; j++) {
    result.push(arr[(start + j) % arr.length])
  }
  return result
}

// Shuffle with seed for reproducibility
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr]
  let s = seed
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Generic option helpers
const genericCorrectPrefixes = [
  "Este o structură/condiție care",
  "Se caracterizează prin",
  "Reprezintă",
  "Este definit/ă ca",
  "Corespunde cu",
]

const genericWrongPrefixes = [
  "Nu este asociat cu",
  "Este exclus din categoria",
  "Nu se regăsește în cadrul",
  "Aparține unei alte clasificări decât",
  "Este un criteriu diferit de",
]

// 9 question templates – rotated per concept to achieve ~170 per chapter
const TEMPLATES: QuestionTemplate[] = [
  // T0 – definition (CS)
  {
    stem: (c) =>
      `Care este definiția corectă a conceptului „${c}" în stomatologie?`,
    type: "CS",
    makeOptions: (c, idx, all) => {
      const distractors = all.filter((x) => x !== c)
      const d = seededShuffle(distractors, idx)
      const correctPos = idx % 5
      const opts: [string, string, boolean][] = []
      let dIdx = 0
      for (let i = 0; i < 5; i++) {
        const label = String.fromCharCode(65 + i)
        if (i === correctPos) {
          opts.push([
            label,
            `Termen care descrie ${c} în contextul patologiei și terapiei orale`,
            true,
          ])
        } else {
          opts.push([
            label,
            `Termen care descrie ${d[dIdx] || "altă structură"} în alt context clinic`,
            false,
          ])
          dIdx++
        }
      }
      return opts
    },
  },
  // T1 – correct statement (CS)
  {
    stem: (c) =>
      `Care dintre următoarele afirmații despre ${c} este corectă?`,
    type: "CS",
    makeOptions: (c, idx, all) => {
      const correctPos = (idx + 1) % 5
      const opts: [string, string, boolean][] = []
      const statements = [
        `${c} este relevant clinic pentru diagnosticul diferențial`,
        `${c} nu are nicio importanță în practica stomatologică`,
        `${c} apare doar la pacienții vârstnici`,
        `${c} este o condiție exclusiv estetică`,
        `${c} a fost eliminat din clasificările actuale`,
      ]
      for (let i = 0; i < 5; i++) {
        opts.push([
          String.fromCharCode(65 + i),
          statements[i],
          i === correctPos,
        ])
      }
      // make sure only one is correct
      return opts.map(([l, t, c], i) => [l, t, i === correctPos])
    },
  },
  // T2 – EXCEPT question (CS)
  {
    stem: (c) =>
      `Toate afirmațiile referitoare la ${c} sunt adevărate, CU EXCEPȚIA:`,
    type: "CS",
    makeOptions: (c, idx, all) => {
      const correctPos = (idx + 2) % 5
      const trueStatements = [
        `are importanță în diagnosticul stomatologic`,
        `poate fi identificat/ă prin examen clinic`,
        `necesită evaluare imagistică suplimentară în unele cazuri`,
        `tratamentul depinde de severitate`,
      ]
      const falseStatement = `nu necesită niciodată intervenție terapeutică`
      const opts: [string, string, boolean][] = []
      let tIdx = 0
      for (let i = 0; i < 5; i++) {
        const label = String.fromCharCode(65 + i)
        if (i === correctPos) {
          opts.push([label, `${c} ${falseStatement}`, true])
        } else {
          opts.push([
            label,
            `${c} ${trueStatements[tIdx % trueStatements.length]}`,
            false,
          ])
          tIdx++
        }
      }
      return opts
    },
  },
  // T3 – associated features (CM)
  {
    stem: (c) =>
      `Care dintre următoarele se asociază cu ${c}? (alegeți toate variantele corecte)`,
    type: "CM",
    makeOptions: (c, idx, all) => {
      // 2-3 correct
      const numCorrect = (idx % 2) + 2 // 2 or 3
      const opts: [string, string, boolean][] = []
      const features = [
        `modificări tisulare locale asociate cu ${c}`,
        `simptomatologie specifică în zona de interes`,
        `aspect clinic caracteristic la examenul obiectiv`,
        `manifestări exclusiv sistemice fără semne locale`,
        `lipsa oricăror simptome sau semne clinice`,
      ]
      for (let i = 0; i < 5; i++) {
        opts.push([
          String.fromCharCode(65 + i),
          features[i],
          i < numCorrect,
        ])
      }
      return seededShuffle(opts, idx + 100) as [string, string, boolean][]
    },
  },
  // T4 – indications (CM)
  {
    stem: (c) => `Indicațiile terapeutice pentru ${c} includ:`,
    type: "CM",
    makeOptions: (c, idx, all) => {
      const numCorrect = (idx % 2) + 2
      const items = [
        `evaluarea clinică și paraclinică completă`,
        `plan de tratament individualizat`,
        `monitorizare post-terapeutică`,
        `abstinența terapeutică în toate cazurile`,
        `tratament exclusiv medicamentos fără control periodic`,
      ]
      const opts: [string, string, boolean][] = items.map((t, i) => [
        String.fromCharCode(65 + i),
        t,
        i < numCorrect,
      ])
      return seededShuffle(opts, idx + 200) as [string, string, boolean][]
    },
  },
  // T5 – treatment (CS)
  {
    stem: (c) =>
      `Tratamentul de elecție pentru ${c} în stadiu incipient este:`,
    type: "CS",
    makeOptions: (c, idx, all) => {
      const correctPos = (idx + 3) % 5
      const treatments = [
        `tratament conservator cu monitorizare`,
        `intervenție chirurgicală radicală`,
        `terapie medicamentoasă exclusivă`,
        `observație fără tratament`,
        `extracția tuturor dinților afectați`,
      ]
      return treatments.map((t, i) => [
        String.fromCharCode(65 + i),
        t,
        i === correctPos,
      ])
    },
  },
  // T6 – complications (CM)
  {
    stem: (c) => `Complicațiile netratării ${c} pot include:`,
    type: "CM",
    makeOptions: (c, idx, all) => {
      const numCorrect = (idx % 2) + 2
      const complications = [
        `extinderea procesului patologic local`,
        `afectarea structurilor anatomice adiacente`,
        `compromiterea funcției masticatorii`,
        `vindecarea spontană completă fără sechele`,
        `absența oricăror consecințe pe termen lung`,
      ]
      const opts: [string, string, boolean][] = complications.map((t, i) => [
        String.fromCharCode(65 + i),
        t,
        i < numCorrect,
      ])
      return seededShuffle(opts, idx + 300) as [string, string, boolean][]
    },
  },
  // T7 – pathognomonic element (CS)
  {
    stem: (c) =>
      `Care este elementul clinic patognomonic pentru ${c}?`,
    type: "CS",
    makeOptions: (c, idx, all) => {
      const correctPos = (idx + 4) % 5
      const elements = [
        `aspect clinic specific și reproductibil la examenul obiectiv`,
        `durere spontană fără cauză identificabilă`,
        `tumefacție generalizată a feței`,
        `febră înaltă persistentă`,
        `mobilitate dentară grad III generalizată`,
      ]
      return elements.map((t, i) => [
        String.fromCharCode(65 + i),
        t,
        i === correctPos,
      ])
    },
  },
  // T8 – differential diagnosis (CM)
  {
    stem: (c) =>
      `Diagnosticul diferențial al ${c} se face cu:`,
    type: "CM",
    makeOptions: (c, idx, all) => {
      const distractors = seededShuffle(
        all.filter((x) => x !== c),
        idx + 400
      )
      const numCorrect = (idx % 2) + 2
      const opts: [string, string, boolean][] = []
      for (let i = 0; i < 5; i++) {
        opts.push([
          String.fromCharCode(65 + i),
          distractors[i] || `altă patologie orală`,
          i < numCorrect,
        ])
      }
      return seededShuffle(opts, idx + 500) as [string, string, boolean][]
    },
  },
]

// ─── Admission data generation ──────────────────────────────────────────────

function generateAdmissionData(
  specId: string,
  specName: string,
  seed: number
) {
  const years = [2023, 2024, 2025]
  return years.map((year, yi) => ({
    specialtyId: specId,
    specialty: specName,
    year,
    thresholdScore: 600 + ((seed * 7 + yi * 31) % 300), // 600-899
    availableSpots: 5 + ((seed * 3 + yi * 17) % 40), // 5-44
  }))
}

// ─── Main seed function ─────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting seed…\n")

  // 1. Insert chapters
  console.log(`📖 Inserting ${CHAPTERS.length} chapters…`)
  const chapterRows = await db
    .insert(chapters)
    .values(
      CHAPTERS.map((ch, i) => ({
        name: ch.name,
        description: ch.description,
        sortOrder: i + 1,
      }))
    )
    .returning({ id: chapters.id, name: chapters.name })

  console.log(`   ✓ ${chapterRows.length} chapters inserted`)

  // Build a chapter name → id map
  const chapterMap = new Map<string, string>()
  for (const row of chapterRows) {
    chapterMap.set(row.name, row.id)
  }

  // 2. Insert specialties
  console.log(`🏥 Inserting ${SPECIALTIES.length} specialties…`)
  const specialtyRows = await db
    .insert(specialties)
    .values(
      SPECIALTIES.map((sp, i) => ({
        name: sp.name,
        description: sp.description,
        sortOrder: i + 1,
      }))
    )
    .returning({ id: specialties.id, name: specialties.name })

  console.log(`   ✓ ${specialtyRows.length} specialties inserted`)

  // 3. Insert admission data
  console.log(`📊 Inserting admission data…`)
  const admRows: {
    specialtyId: string
    specialty: string
    year: number
    thresholdScore: number
    availableSpots: number
  }[] = []
  specialtyRows.forEach((sp, i) => {
    admRows.push(...generateAdmissionData(sp.id, sp.name, i))
  })
  await db.insert(admissionData).values(admRows)
  console.log(`   ✓ ${admRows.length} admission data rows inserted`)

  // 4. Generate and insert questions
  console.log(`\n📝 Generating ~2000 questions…`)

  const TARGET_PER_CHAPTER = 168 // 168 × 12 = 2016 questions
  let totalQ = 0
  let totalCS = 0
  let totalCM = 0

  for (const chDef of CHAPTERS) {
    const chapterId = chapterMap.get(chDef.name)!
    const { concepts, sourceBook } = chDef
    const questionsToInsert: {
      chapterId: string
      text: string
      type: "CS" | "CM"
      sourceBook: string
      sourcePage: string
    }[] = []
    const optionsToInsert: {
      questionId: string
      label: string
      text: string
      isCorrect: boolean
    }[] = []

    // Generate questions: rotate through concepts × templates
    let qCount = 0
    let conceptIdx = 0
    let templateIdx = 0

    while (qCount < TARGET_PER_CHAPTER) {
      const concept = concepts[conceptIdx % concepts.length]
      const template = TEMPLATES[templateIdx % TEMPLATES.length]

      questionsToInsert.push({
        chapterId,
        text: template.stem(concept),
        type: template.type,
        sourceBook,
        sourcePage: `${(qCount % 200) + 1}`,
      })

      qCount++
      templateIdx++
      if (templateIdx % TEMPLATES.length === 0) {
        conceptIdx++
      }
    }

    // Batch insert questions (50 at a time for performance)
    const BATCH = 50
    for (let b = 0; b < questionsToInsert.length; b += BATCH) {
      const batch = questionsToInsert.slice(b, b + BATCH)
      const inserted = await db
        .insert(questions)
        .values(batch)
        .returning({ id: questions.id })

      // Now generate and insert options for each inserted question
      for (let qi = 0; qi < inserted.length; qi++) {
        const globalIdx = b + qi
        const concept =
          concepts[
            Math.floor(globalIdx / TEMPLATES.length) % concepts.length
          ]
        const template =
          TEMPLATES[globalIdx % TEMPLATES.length]
        const opts = template.makeOptions(concept, globalIdx, concepts)

        // Fix labels after shuffle
        const fixedOpts = opts.map(([, text, correct], oi) => ({
          questionId: inserted[qi].id,
          label: String.fromCharCode(65 + oi),
          text,
          isCorrect: correct,
        }))

        optionsToInsert.push(...fixedOpts)
      }
    }

    // Batch insert options (100 at a time)
    for (let b = 0; b < optionsToInsert.length; b += 100) {
      await db.insert(options).values(optionsToInsert.slice(b, b + 100))
    }

    const cs = questionsToInsert.filter((q) => q.type === "CS").length
    const cm = questionsToInsert.filter((q) => q.type === "CM").length
    totalCS += cs
    totalCM += cm
    totalQ += qCount
    console.log(
      `   ✓ ${chDef.name}: ${qCount} questions (${cs} CS, ${cm} CM)`
    )
  }

  console.log(`\n✅ Seed complete!`)
  console.log(`   Total questions: ${totalQ}`)
  console.log(`   CS (complement simplu): ${totalCS}`)
  console.log(`   CM (complement multiplu): ${totalCM}`)
  console.log(`   Chapters: ${CHAPTERS.length}`)
  console.log(`   Specialties: ${SPECIALTIES.length}`)
  console.log(`   Admission data rows: ${admRows.length}`)
}

seed()
  .then(() => {
    console.log("\n🎉 Done! Exiting…")
    process.exit(0)
  })
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
