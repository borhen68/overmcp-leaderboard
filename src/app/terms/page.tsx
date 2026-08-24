import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Service agreement" title="Terms of use" updated="August 24, 2026">
      <h2>The service</h2>
      <p>OverMCP operates a public product-discovery leaderboard. A payment purchases a bid amount, not a fixed duration, number of visitors, endorsement, or business result.</p>
      <h2>Your submissions</h2>
      <p>You must have the right to submit the product information you provide. You may not submit malware, phishing pages, illegal content, impersonation, or misleading claims.</p>
      <h2>Payments</h2>
      <p>Payments are handled by Stripe. Completed bids are normally final once reflected on the public board, except where a refund is required by law or issued to correct a technical or billing error.</p>
      <h2>Availability</h2>
      <p>We work to keep rankings and click measurements accurate, but the service may be interrupted or changed. We may remove abusive traffic and correct rankings affected by payment reversals or technical errors.</p>
      <h2>Daily race</h2>
      <p>Community backing is free and separate from paid placement. Manual repeat backing is allowed and each accepted backing counts as one action, not as a new unique visitor. It provides a temporary daily crowd rank, not ownership, a prize, or a guaranteed volume of traffic. We may rate-limit or remove automated, excessive, or suspicious backing.</p>
      <h2>Liability</h2>
      <p>To the maximum extent allowed by law, OverMCP is provided as-is and is not liable for indirect, incidental, or consequential losses arising from use of the service.</p>
    </LegalPage>
  );
}
