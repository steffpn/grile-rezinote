import { z } from "zod"

export const specialtySchema = z.object({
  name: z
    .string()
    .min(1, "Numele specialitatii este obligatoriu")
    .max(200, "Numele specialitatii poate avea maxim 200 de caractere"),
  description: z
    .string()
    .max(1000, "Descrierea poate avea maxim 1000 de caractere")
    .optional()
    .or(z.literal("")),
})

export type SpecialtyInput = z.infer<typeof specialtySchema>

export const admissionDataSchema = z.object({
  specialtyId: z.string().uuid("ID specialitate invalid"),
  umf: z
    .string()
    .min(1, "UMF este obligatoriu")
    .max(120, "UMF poate avea maxim 120 de caractere"),
  year: z
    .coerce.number()
    .int("Anul trebuie sa fie numar intreg")
    .min(2000, "Anul minim este 2000")
    .max(2100, "Anul maxim este 2100"),
  thresholdScore: z
    .coerce.number()
    .int("Pragul trebuie sa fie numar intreg")
    .min(0, "Pragul minim este 0")
    .max(950, "Pragul maxim este 950 (scorul maxim la examen)"),
  availableSpots: z
    .coerce.number()
    .int("Numarul de locuri trebuie sa fie numar intreg")
    .min(0, "Numarul de locuri nu poate fi negativ"),
})

export type AdmissionDataInput = z.infer<typeof admissionDataSchema>

export const admissionImportRowSchema = z.object({
  specialty: z
    .string()
    .min(1, "Numele specialitatii este obligatoriu"),
  umf: z
    .string()
    .min(1, "UMF este obligatoriu")
    .max(120, "UMF poate avea maxim 120 de caractere"),
  year: z
    .coerce.number()
    .int("Anul trebuie sa fie numar intreg")
    .min(2000, "Anul minim este 2000")
    .max(2100, "Anul maxim este 2100"),
  thresholdScore: z
    .coerce.number()
    .int("Pragul trebuie sa fie numar intreg")
    .min(0, "Pragul minim este 0")
    .max(950, "Pragul maxim este 950"),
  availableSpots: z
    .coerce.number()
    .int("Numarul de locuri trebuie sa fie numar intreg")
    .min(0, "Numarul de locuri nu poate fi negativ"),
})

export type AdmissionImportRow = z.infer<typeof admissionImportRowSchema>

export type AdmissionImportResult = {
  imported: number
  errors: { row: number; message: string }[]
  total: number
}
