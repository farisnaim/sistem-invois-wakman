import PinGate from "@/components/PinGate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PinGate>{children}</PinGate>;
}
