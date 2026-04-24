import StaticInfoPage from "../components/StaticInfoPage";

export default function Terms() {
  return (
    <StaticInfoPage
      title="Terms of Use"
      subtitle="These rules keep CampusKart practical, safe, and focused on real student transactions."
      sections={[
        {
          title: "Seller responsibilities",
          paragraphs: [
            "List items honestly, keep pricing accurate, and only upload media you have the right to share.",
            "Sellers should respond to chats in good faith and honor agreed deals whenever possible.",
          ],
        },
        {
          title: "Buyer responsibilities",
          paragraphs: [
            "Buyers should ask clear questions, inspect items before paying, and use the report tools when something looks unsafe.",
            "Abuse, spam, and scam activity can lead to blocks or account restrictions.",
          ],
        },
      ]}
      primaryCta={{ label: "Browse Rules-Friendly Listings", to: "/products" }}
      secondaryCta={{ label: "Contact Support", to: "/contact" }}
    />
  );
}