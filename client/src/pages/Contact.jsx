import StaticInfoPage from "../components/StaticInfoPage";

export default function Contact() {
  return (
    <StaticInfoPage
      title="Contact CampusKart"
      subtitle="Reach out for support, moderation help, or general feedback about the campus marketplace."
      sections={[
        {
          title: "Support channels",
          paragraphs: [
            "If you need help with login, account verification, or listing issues, the fastest place to start is your profile or the chat area.",
            "For safety concerns or scam reports, use the built-in report action inside chat so the moderation team can review it with context.",
          ],
        },
        {
          title: "Best way to ask for help",
          paragraphs: [
            "Include your username, the item or chat involved, and a short description of the issue.",
            "That helps resolve problems faster than a vague message with no context.",
          ],
        },
      ]}
      primaryCta={{ label: "Open Messages", to: "/chat" }}
      secondaryCta={{ label: "View Profile", to: "/profile" }}
    />
  );
}