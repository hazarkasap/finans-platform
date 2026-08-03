"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiFetch } from "@/lib/api-client";

type GroupResponse = {
  group: { id: string; name: string };
};

export function NewGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [memberEmails, setMemberEmails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWarnings([]);
    setLoading(true);

    try {
      const emails = memberEmails
        .split(/[,;\s]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const { group } = await apiFetch<GroupResponse>("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      const failed: string[] = [];
      for (const email of emails) {
        try {
          await apiFetch(`/api/groups/${group.id}/members`, {
            method: "POST",
            body: JSON.stringify({ email }),
          });
        } catch {
          failed.push(email);
        }
      }

      if (failed.length > 0) {
        setWarnings([
          `Grup oluşturuldu; eklenemeyen e-postalar: ${failed.join(", ")}`,
        ]);
      }

      router.push(`/groups/${group.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Grup oluşturulamadı");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {warnings.map((w) => (
        <p key={w} className="text-sm text-amber-600 dark:text-amber-400">
          {w}
        </p>
      ))}
      <div className="space-y-2">
        <Label htmlFor="name">Grup adı</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ev Arkadaşları"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="members">Üye e-postaları (virgülle ayırın)</Label>
        <Input
          id="members"
          value={memberEmails}
          onChange={(e) => setMemberEmails(e.target.value)}
          placeholder="member.one@example.com, member.two@example.com"
        />
        <p className="text-xs text-zinc-500">
          Yalnızca kayıtlı kullanıcılar eklenebilir
        </p>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Oluşturuluyor…" : "Grup oluştur"}
      </Button>
    </form>
  );
}
