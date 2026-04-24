import StaticInfoPage from "../components/StaticInfoPage";

export default function Privacy() {
  return (
    <StaticInfoPage
      title="Privacy Policy"
      subtitle="CampusKart keeps only the data needed to run the marketplace and protect users."
      sections={[
        {
          title: "What we store",
          paragraphs: [
            "We store account details, listings, messages, saved searches, reports, and reviews so the marketplace can function.",
            "Uploaded documents such as student ID cards are used only for verification workflows.",
          ],
        },
        {
          title: "How data is used",
          paragraphs: [
            "Your information is used to authenticate you, show your listings, and support messaging, search alerts, and moderation.",
            "We do not need your data for unrelated third-party marketing.",
          ],
        },
      ]}
      primaryCta={{ label: "Read Terms", to: "/terms" }}
      secondaryCta={{ label: "Need help?", to: "/contact" }}
    />
  );
}