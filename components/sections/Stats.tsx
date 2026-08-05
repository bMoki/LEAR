import { InlineText } from "@/components/ui/RichText";
import { getStats } from "@/lib/content";

export async function Stats() {
  const stats = await getStats();

  return (
    <div className="stats">
      {stats.map((s, i) => (
        <div className="stat" key={i}>
          <div className="num">
            <InlineText>{s.num}</InlineText>
          </div>
          <div className="lbl">{s.lbl}</div>
        </div>
      ))}
    </div>
  );
}
