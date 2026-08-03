import { PersonalPortfolioView } from "@/components/portfolio/personal-portfolio-view";
import { PageHeader } from "@/components/page-header";
import { getPersonalPortfolio } from "@/lib/portfolio";
import { requireSessionUser } from "@/lib/session";

export default async function PortfolioPage() {
  const user = await requireSessionUser();
  const portfolio = await getPersonalPortfolio(user.id);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Kişisel portföy"
        description={`${user.displayName ?? user.email} — tüm gruplardaki borç ve alacak özeti`}
      />
      <PersonalPortfolioView portfolio={portfolio} />
    </div>
  );
}
