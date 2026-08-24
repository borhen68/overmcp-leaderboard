import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Data practices" title="Privacy policy" updated="August 24, 2026">
      <h2>What we collect</h2>
      <p>When you place a bid, we store the product URL, name, description, category, bid amount, payment state, and receipt email. Stripe processes card details; OverMCP does not store full card numbers.</p>
      <h2>Audience measurement</h2>
      <p>We store a random browser identifier to measure current and total visitors and to enforce one backing per daily race. DataFast uses first-party visitor and session identifiers to measure page activity and attribute completed Stripe payments to marketing channels. When someone submits the placement checkout form, DataFast also receives the receipt email and submitted product details as a checkout-intent goal. For outbound-click and race-support deduplication, a one-way hash is created from limited network and browser signals. Raw IP addresses are not stored in the click or race-support tables.</p>
      <h2>Why we use data</h2>
      <p>Data is used to operate rankings, confirm payments, measure outbound visits, prevent obvious manipulation, troubleshoot the service, and comply with legal obligations.</p>
      <h2>Retention and control</h2>
      <p>Payment and bid records are retained for accounting and dispute handling. Browser identifiers can be reset by clearing this site’s cookies and local storage. You may request correction or deletion where applicable.</p>
      <h2>Processors</h2>
      <p>OverMCP uses Stripe for payments, DataFast for audience measurement and revenue attribution, Turso for database hosting, and the selected application host for delivery and operational logs.</p>
    </LegalPage>
  );
}
