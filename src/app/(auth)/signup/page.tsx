import type { Metadata } from "next"
import { SignupForm } from "@/components/auth/signup-form"
import { RegistrationClosed } from "@/components/auth/registration-closed"
import { isRegistrationOpen } from "@/lib/launch"

export const metadata: Metadata = {
  title: "Inregistrare — grile-ReziNOTE",
}

export default function SignupPage() {
  // Pre-launch: stale /signup links land on the waitlist instead of the form.
  if (!isRegistrationOpen()) {
    return <RegistrationClosed />
  }
  return <SignupForm />
}
