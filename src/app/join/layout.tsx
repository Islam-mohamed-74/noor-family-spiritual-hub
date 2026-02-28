import { Metadata } from "next";

export const metadata: Metadata = {
  title: "انضمام للعائلة | عائلة نور",
  description: "انضم إلى عائلتك بواسطة رمز الدعوة",
};

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
