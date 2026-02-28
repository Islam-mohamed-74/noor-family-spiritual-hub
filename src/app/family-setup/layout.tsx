import { Metadata } from "next";

export const metadata: Metadata = {
  title: "إعداد العائلة | عائلة نور",
  description: "أنشئ بيئة إيمانية لعائلتك أو انضم لعائلة موجودة",
};

export default function FamilySetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
