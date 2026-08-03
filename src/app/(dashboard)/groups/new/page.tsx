import Link from "next/link";

import { NewGroupForm } from "@/components/groups/new-group-form";
import { Button } from "@/components/ui/button";

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
          <Link href="/groups">← Geri</Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Yeni grup
        </h1>
      </div>
      <NewGroupForm />
    </div>
  );
}
