import Link from "next/link";
import { getNav } from "@/lib/content";

export async function Topbar() {
  const nav = await getNav();

  return (
    <header className="topbar">
      <Link href="/" className="wordmark">
        <span className="lear">{nav.brandName}</span>
        <span className="tag">{nav.brandTag}</span>
      </Link>
      <nav className="nav">
        {nav.links.map((link) => (
          <a key={link.href} href={link.href} className={link.pin ? "pin" : undefined}>
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
