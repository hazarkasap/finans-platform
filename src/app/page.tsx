import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center px-4 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] sm:py-16">
      <main className="w-full max-w-lg space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Finans</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Kişisel finans ve ortak gider takibi — TRY
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Başlayın</CardTitle>
            <CardDescription>
              Gruplar, giderler, borç özeti, kişisel hesaplar ve faturalar tek
              uygulamada.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/register">Kayıt ol</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/login">Giriş yap</Link>
            </Button>
          </CardContent>
        </Card>

        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <li>Ortak giderler ve borç sadeleştirme</li>
          <li>Kişisel hesap ve işlem takibi</li>
          <li>Fatura hatırlatıcıları</li>
        </ul>
      </main>
    </div>
  );
}
