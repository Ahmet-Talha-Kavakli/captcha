export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5 py-14">
      <main className="w-full max-w-[440px]">{children}</main>
    </div>
  );
}
