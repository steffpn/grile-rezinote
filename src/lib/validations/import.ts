import { z } from "zod"

/**
 * Import/Export column structure.
 *
 * Canonical (English) column names used by the export pipeline and the
 * CSV/XLSX template generator:
 *   chapter_name, subchapter (optional), question_text,
 *   type (CS/CM), option_a..option_e,
 *   correct_answers (comma-separated: "A,C,E"),
 *   source_book (optional), source_page (optional)
 *
 * Romanian aliases (case-insensitive) are accepted too so files produced
 * by `scripts/import-xlsx-materii.mjs` and old admin exports can be
 * re-imported without renaming columns:
 *   Materie    → chapter_name
 *   Capitol    → subchapter
 *   Enunț/Enunt→ question_text
 *   Tip (A→CS, B→CM, plus CS/CM) → type
 *   A..E       → option_a..option_e
 *   Răspuns/Raspuns → correct_answers
 *   Carte / Sursă → source_book
 *   Pagina / Pagină → source_page
 */

const validLabels = ["A", "B", "C", "D", "E"] as const

export const importRowSchema = z
  .object({
    chapter_name: z.string().min(1, "Numele capitolului este obligatoriu"),
    subchapter: z.string().optional().or(z.literal("")),
    question_text: z.string().min(1, "Textul întrebării este obligatoriu"),
    type: z.enum(["CS", "CM"], {
      message: 'Tipul trebuie să fie "CS" sau "CM"',
    }),
    option_a: z.string().min(1, "Opțiunea A este obligatorie"),
    option_b: z.string().min(1, "Opțiunea B este obligatorie"),
    option_c: z.string().min(1, "Opțiunea C este obligatorie"),
    option_d: z.string().min(1, "Opțiunea D este obligatorie"),
    option_e: z.string().min(1, "Opțiunea E este obligatorie"),
    correct_answers: z
      .string()
      .min(1, "Răspunsurile corecte sunt obligatorii")
      .refine(
        (val) => {
          const answers = val
            .split(/[,;\s]+/)
            .map((a) => a.trim().toUpperCase())
            .filter(Boolean)
          if (answers.length === 0) return false
          return answers.every((a) =>
            (validLabels as readonly string[]).includes(a),
          )
        },
        {
          message:
            'Răspunsurile corecte trebuie să fie litere A-E separate prin virgulă (ex: A,C,E)',
        },
      ),
    source_book: z.string().optional().or(z.literal("")),
    source_page: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      const answers = data.correct_answers
        .split(/[,;\s]+/)
        .map((a) => a.trim().toUpperCase())
            .filter(Boolean)
      if (data.type === "CS") return answers.length === 1
      if (data.type === "CM") return answers.length >= 2
      return true
    },
    {
      message:
        "CS trebuie să aibă exact 1 răspuns corect, CM cel puțin 2",
      path: ["correct_answers"],
    },
  )

export type ImportRow = z.infer<typeof importRowSchema>

export interface ImportError {
  row: number
  message: string
  column?: string
}

export interface ImportResult {
  imported: number
  updated: number
  errors: ImportError[]
}

export const IMPORT_COLUMNS = [
  "chapter_name",
  "subchapter",
  "question_text",
  "type",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "option_e",
  "correct_answers",
  "source_book",
  "source_page",
] as const

export type ImportColumn = (typeof IMPORT_COLUMNS)[number]

/**
 * Canonical → user-facing label, used by the XLSX template + UI hints.
 */
export const COLUMN_LABELS: Record<ImportColumn, string> = {
  chapter_name: "Capitol (Materie)",
  subchapter: "Subcapitol (opțional)",
  question_text: "Întrebare",
  type: "Tip (CS / CM)",
  option_a: "Opțiunea A",
  option_b: "Opțiunea B",
  option_c: "Opțiunea C",
  option_d: "Opțiunea D",
  option_e: "Opțiunea E",
  correct_answers: "Răspunsuri corecte (ex: A,C,E)",
  source_book: "Carte sursă (opțional)",
  source_page: "Pagină (opțional)",
}

const COLUMN_ALIASES: Record<string, ImportColumn> = {
  // canonical (lowercased)
  chapter_name: "chapter_name",
  subchapter: "subchapter",
  question_text: "question_text",
  type: "type",
  option_a: "option_a",
  option_b: "option_b",
  option_c: "option_c",
  option_d: "option_d",
  option_e: "option_e",
  correct_answers: "correct_answers",
  source_book: "source_book",
  source_page: "source_page",
  // Romanian aliases
  materie: "chapter_name",
  capitol: "subchapter",
  subcapitol: "subchapter",
  enunt: "question_text",
  "enunț": "question_text",
  intrebare: "question_text",
  "întrebare": "question_text",
  tip: "type",
  a: "option_a",
  b: "option_b",
  c: "option_c",
  d: "option_d",
  e: "option_e",
  raspuns: "correct_answers",
  "răspuns": "correct_answers",
  raspunsuri: "correct_answers",
  "răspunsuri": "correct_answers",
  corecte: "correct_answers",
  carte: "source_book",
  sursa: "source_book",
  "sursă": "source_book",
  pagina: "source_page",
  "pagină": "source_page",
}

/**
 * Map an arbitrary spreadsheet header to a canonical column key.
 * Returns null if the header is not recognised.
 */
export function resolveColumn(header: string): ImportColumn | null {
  const normalised = header
    .trim()
    .toLowerCase()
    // strip diacritic accents so "Răspuns" matches "raspuns" entries we keep too
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_")
  // try direct match first
  const direct = COLUMN_ALIASES[normalised as keyof typeof COLUMN_ALIASES]
  if (direct) return direct
  // try once more without diacritic stripping (in case the alias keeps them)
  const raw = header.trim().toLowerCase()
  const rawHit = COLUMN_ALIASES[raw as keyof typeof COLUMN_ALIASES]
  return rawHit ?? null
}

/**
 * Coerce a raw type value into "CS"/"CM" (or empty string when unknown).
 * Accepts the Romanian shorthand (A → CS, B → CM) used by the
 * "Materie/Capitol" XLSX format.
 */
export function normalizeType(raw: string): string {
  const v = raw.trim().toUpperCase()
  if (v === "A") return "CS"
  if (v === "B") return "CM"
  if (v === "CS" || v === "CM") return v
  return v
}

/**
 * Build a canonical ImportRow from a raw record keyed by spreadsheet
 * headers (any alias). Missing columns become empty strings — validation
 * is left to importRowSchema.safeParse.
 */
export function buildImportRow(raw: Record<string, string>): ImportRow {
  const out: Record<ImportColumn, string> = {
    chapter_name: "",
    subchapter: "",
    question_text: "",
    type: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    option_e: "",
    correct_answers: "",
    source_book: "",
    source_page: "",
  }

  for (const [header, value] of Object.entries(raw)) {
    const col = resolveColumn(header)
    if (!col) continue
    const v = value == null ? "" : String(value).trim()
    if (col === "type") {
      out.type = normalizeType(v)
    } else if (col === "correct_answers") {
      // normalise separators → comma
      out.correct_answers = v
        .split(/[,;\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
        .join(",")
    } else {
      out[col] = v
    }
  }

  return out as ImportRow
}

/**
 * Heuristic used by the upload UI: does this row look intentionally blank
 * (all canonical text fields empty) and should be skipped silently rather
 * than reported as an error?
 */
export function isBlankRow(row: ImportRow): boolean {
  return !(
    row.chapter_name ||
    row.subchapter ||
    row.question_text ||
    row.option_a ||
    row.option_b ||
    row.option_c ||
    row.option_d ||
    row.option_e
  )
}
