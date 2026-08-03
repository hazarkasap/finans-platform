import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";

export default async function GroupsPage() {
  const user = await requireSessionUser();

  const groups = await prisma.group.findMany({
    where: { memberships: { some: { userId: user.id } } },
    include: {
      memberships: {
        include: {
          user: { select: { id: true, displayName: true, email: true } },
        },
      },
      _count: { select: { expenses: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Gruplar"
        description="Ortak giderlerinizi yönetin"
        action={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/groups/new">Yeni grup</Link>
          </Button>
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          title="Henüz grup yok"
          description="Ev arkadaşları veya arkadaş grupları için yeni bir grup oluşturun."
          action={
            <Button asChild>
              <Link href="/groups/new">Grup oluştur</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>
                    {group.memberships.length} üye · {group._count.expenses}{" "}
                    gider
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-500">
                    {group.memberships
                      .map((m) => m.user.displayName ?? m.user.email)
                      .join(", ")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
