import { getFooter } from "@/lib/content";

export async function Footer() {
  const footer = await getFooter();

  return (
    <footer className="footer">
      <div className="footer-brand">
        <span className="name">{footer.brandName}</span>
        {footer.brandText}
      </div>

      {footer.columns.map((col) => (
        <div className="footer-col" key={col.title}>
          <strong>{col.title}</strong>
          {col.links.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      ))}

      <div className="fine">
        {footer.fine.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
    </footer>
  );
}
