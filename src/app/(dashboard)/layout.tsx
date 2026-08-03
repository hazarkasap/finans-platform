import { AppShellClient } from "@/components/app-shell-client";
import { requireSessionUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSessionUser();

  return <AppShellClient user={user}>{children}</AppShellClient>;
}
