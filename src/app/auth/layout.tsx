import { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل الدخول | عائلة نور",
  description: "سجل دخولك أو أنشئ حساباً لعائلتك",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
