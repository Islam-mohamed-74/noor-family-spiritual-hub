import { getFamilyPageData } from "@/lib/queries";
import FamilyClient from "./FamilyClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Ø¹Ø§Ø¦Ù„ØªÙŠ | Ù†ÙˆØ± Ø§Ù„Ø¹Ø§Ø¦Ù„Ø©",
  description: "ØªØ§Ø¨Ø¹ ØªÙ‚Ø¯Ù‘Ù… Ø£ÙØ±Ø§Ø¯ Ø¹Ø§Ø¦Ù„ØªÙƒ ÙˆØ§Ù„ØªØ­Ø¯ÙŠØ§Øª Ø§Ù„Ù…Ø´ØªØ±ÙƒØ©",
};

export default async function FamilyPage() {
  const familyData = await getFamilyPageData();

  if (!familyData) {
    // We don't redirect here to allow client side to handle lack of family
    // But metadata is set correctly
  }

  // Passing null — client will fetch full data (members, challenges, events, rewards)
  return <FamilyClient initialData={null} />;
}
