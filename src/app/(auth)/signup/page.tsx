import type { Metadata } from "next"
import { SignupForm } from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Inregistrare — grile-ReziNOTE",
}

export default function SignupPage() {
  return <SignupForm />
}
