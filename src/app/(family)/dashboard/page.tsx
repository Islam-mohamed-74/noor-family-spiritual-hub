import { getDashboardData } from "@/lib/queries";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "لوحة التحكم | نور العائلة",
  description: "تابع عبادتك اليومية ونقاطك مع عائلتك",
};

export default async function DashboardPage() {
  const { user, dashboardData } = await getDashboardData();

  if (!user || !dashboardData) {
    redirect("/auth");
  }

  return (
    <DashboardClient initialData={dashboardData} />
  );
}
