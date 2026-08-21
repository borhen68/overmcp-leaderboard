import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Ranking rules" };

export default function RulesPage() {
  return (
    <LegalPage eyebrow="How the board works" title="Ranking rules" updated="August 21, 2026">
      <h2>Ranking</h2>
      <p>Products are ranked by their total confirmed bid value, highest first. Confirmed value can come from successfully paid bids or a clearly labeled promotional credit issued by OverMCP. If two products have the same total, the product that reached that total first ranks higher.</p>
      <h2>Bids</h2>
      <p>The minimum paid bid is $5. A new payment adds to a product’s existing total. Promotional credits count at their displayed value and are identified on the leaderboard. Pending, failed, expired, refunded, or disputed payments do not count toward rank.</p>
      <h2>Placement duration</h2>
      <p>A product keeps its earned position until another product’s confirmed total passes it. There is no recurring listing fee and no guaranteed duration, traffic volume, or conversion outcome.</p>
      <h2>Public measurements</h2>
      <p>OverMCP publicly shows confirmed bid value, identifies promotional credits, and reports tracked outbound clicks. Automated preview bots are excluded, and repeated clicks from the same browser and network are deduplicated within a short window.</p>
      <h2>Removal</h2>
      <p>We may hide products that are illegal, deceptive, unsafe, infringing, malicious, or materially misrepresented. Buying placement does not imply endorsement by OverMCP.</p>
    </LegalPage>
  );
}
