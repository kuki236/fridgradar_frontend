import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AIAssistant } from "@/features/ai/components/ai-assistant";
import { InvitationBanner } from "@/features/household/components/invitation-banner";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full">
      <Sidebar />
      <main className="flex-1 flex flex-col pb-16 md:pb-0 overflow-y-auto">
        <InvitationBanner />
        {children}
      </main>
      <MobileNav />
      <AIAssistant />
    </div>
  );
}
