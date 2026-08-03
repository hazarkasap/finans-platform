export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
