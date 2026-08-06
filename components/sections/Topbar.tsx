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
        {/* A chave é a posição, e não o `href`: um endereço recusado pela
            sanitização vira `#` (ver `lib/content/href.ts`), e dois deles
            colidiriam. */}
        {nav.links.map((link, i) => (
          <a key={i} href={link.href} className={link.pin ? "pin" : undefined}>
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
