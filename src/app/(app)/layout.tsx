import { Nav } from "@/components/nav";

// Signed-in surface. Login lives outside this group so it stays bare.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
