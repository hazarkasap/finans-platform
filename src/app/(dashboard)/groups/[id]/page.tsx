import Link from "next/link";

import { GroupDetail } from "@/components/groups/group-detail";
import { Button } from "@/components/ui/button";
import { requireSessionUser } from "@/lib/session";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupDetailPage({ params }: PageProps) {
  const user = await requireSessionUser();
  const { id } = await params;

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
        <Link href="/groups">← Gruplar</Link>
      </Button>
      <GroupDetail groupId={id} currentUserId={user.id} />
    </div>
  );
}
