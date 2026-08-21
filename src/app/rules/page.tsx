import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Ranking rules" };

export default function RulesPage() {
  return (
    <LegalPage eyebrow="How the board works" title="Ranking rules" updated="August 21, 2026">
      <h2>Ranking</h2>
      <p>Products are ranked by the total value of successfully paid bids, highest first. If two products have the same total, the product that reached that total first ranks higher.</p>
      <h2>Bids</h2>
      <p>The minimum bid is $5. A new payment adds to a product’s existing total. A lower bid can still place a product anywhere its resulting total qualifies. Pending, failed, expired, refunded, or disputed payments do not count toward rank.</p>
      <h2>Placement duration</h2>
      <p>A product keeps its earned position until another product’s paid total passes it. There is no recurring listing fee and no guaranteed duration, traffic volume, or conversion outcome.</p>
      <h2>Public measurements</h2>
      <p>OverMCP publicly shows total paid bids and tracked outbound clicks. Automated preview bots are excluded, and repeated clicks from the same browser and network are deduplicated within a short window.</p>
      <h2>Removal</h2>
      <p>We may hide products that are illegal, deceptive, unsafe, infringing, malicious, or materially misrepresented. Buying placement does not imply endorsement by OverMCP.</p>
    </LegalPage>
  );
}
