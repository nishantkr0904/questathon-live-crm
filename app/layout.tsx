import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = { title: "Account Quest CRM", description: "Evidence-led account operating system" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
