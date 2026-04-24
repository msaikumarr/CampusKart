import StaticInfoPage from "../components/StaticInfoPage";

export default function About() {
  return (
    <StaticInfoPage
      title="About CampusKart"
      subtitle="CampusKart is a student-first marketplace for buying, selling, and trading within college communities."
      sections={[
        {
          title: "Why we built it",
          paragraphs: [
            "Students often need a fast, trusted place to pass along books, gadgets, furniture, and more without leaving the campus community.",
            "CampusKart keeps the experience simple: list an item, chat directly, and close the deal locally.",
          ],
        },
        {
          title: "What makes it useful",
          paragraphs: [
            "The platform focuses on college-only access, direct messaging, saved searches, safety reporting, and ratings after sale.",
            "That combination keeps listings relevant while reducing the noise that usually slows down student marketplaces.",
          ],
        },
      ]}
      primaryCta={{ label: "Browse Listings", to: "/products" }}
      secondaryCta={{ label: "Start Selling", to: "/sell" }}
    />
  );
}