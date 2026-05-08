import { notFound } from "next/navigation"

/**
 * Dev-only preview layout. Folosit pentru visual QA pe shell-uri / branded
 * components fără să loghezi un user real. Vizibil doar în development.
 */
export default function DevPreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (process.env.NODE_ENV === "production") {
    notFound()
  }
  return <>{children}</>
}
