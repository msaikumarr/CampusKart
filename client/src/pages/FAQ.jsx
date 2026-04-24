import StaticInfoPage from "../components/StaticInfoPage";

export default function FAQ() {
  return (
    <StaticInfoPage
      title="Help & FAQ"
      subtitle="Quick answers to the most common questions about buying, selling, and staying safe on CampusKart."
      sections={[
        {
          title: "How do I start selling?",
          paragraphs: [
            "Go to Sell, add your item photos, fill in the listing details, and post it.",
            "If your account is pending verification, you’ll need admin approval before posting items.",
          ],
        },
        {
          title: "How do I stay safe?",
          paragraphs: [
            "Keep conversations inside the chat, use the block and report tools if needed, and meet on campus in public places.",
            "If a user looks suspicious, the scam warning in chat is there for a reason.",
          ],
        },
      ]}
      primaryCta={{ label: "Open Chat", to: "/chat" }}
      secondaryCta={{ label: "Start Selling", to: "/sell" }}
    />
  );
}