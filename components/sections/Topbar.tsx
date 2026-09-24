import Link from "next/link";
import { NavMenu } from "./NavMenu";
import { getNav } from "@/lib/content";

export async function Topbar() {
  const nav = await getNav();

  return (
    <header className="topbar">
      <Link href="/" className="wordmark">
        <span className="lear">{nav.brandName}</span>
        <span className="tag">{nav.brandTag}</span>
      </Link>
      <NavMenu links={nav.links} />
    </header>
  );
}
