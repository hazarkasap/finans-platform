import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { userLabel } from "@/lib/format";

type Member = {
  id: string;
  email: string;
  displayName: string | null;
};

export function MobileBalanceList({
  members,
  netBalances,
}: {
  members: Member[];
  netBalances: Record<string, number>;
}) {
  return (
    <ul className="space-y-2 md:hidden">
      {members.map((m) => {
        const net = netBalances[m.id] ?? 0;
        return (
          <li
            key={m.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <span className="min-w-0 truncate font-medium">{userLabel(m)}</span>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Money amount={net} showSign />
              {net > 0 ? (
                <Badge variant="success">alacaklı</Badge>
              ) : net < 0 ? (
                <Badge variant="danger">borçlu</Badge>
              ) : (
                <Badge variant="secondary">dengede</Badge>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
