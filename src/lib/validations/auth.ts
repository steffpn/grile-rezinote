import { z } from "zod"

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Numele trebuie sa aiba cel putin 2 caractere" }),
  email: z
    .string()
    .email({ message: "Adresa de email nu este valida" }),
  password: z
    .string()
    .min(8, { message: "Parola trebuie sa aiba cel putin 8 caractere" })
    .max(128, { message: "Parola este prea lunga" })
    .regex(/[a-zA-Z]/, {
      message: "Parola trebuie sa contina cel putin o litera",
    })
    .regex(/[0-9]/, {
      message: "Parola trebuie sa contina cel putin o cifra",
    }),
  yearOfStudy: z.coerce
    .number()
    .min(1, { message: "Anul de studiu trebuie sa fie intre 1 si 6" })
    .max(6, { message: "Anul de studiu trebuie sa fie intre 1 si 6" }),
})

export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Adresa de email nu este valida" }),
  password: z
    .string()
    .min(1, { message: "Parola este obligatorie" }),
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: "Adresa de email nu este valida" }),
})

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Parola trebuie sa aiba cel putin 8 caractere" })
      .max(128, { message: "Parola este prea lunga" })
      .regex(/[a-zA-Z]/, {
        message: "Parola trebuie sa contina cel putin o litera",
      })
      .regex(/[0-9]/, {
        message: "Parola trebuie sa contina cel putin o cifra",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parolele nu se potrivesc",
    path: ["confirmPassword"],
  })

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
