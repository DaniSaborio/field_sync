"use client";
 
import { AdminActivityFeed } from "./admin/admin-activity-feed";
import { AdminHeader } from "./admin/admin-header";
import { AdminQuickActions } from "./admin/admin-quick-actions";
import { AdminStats } from "./admin/admin-stats";
 
type AdminScreenProps = {
  onBack: () => void;
};
 
export function AdminScreen({ onBack }: AdminScreenProps) {
  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_30%),linear-gradient(180deg,#0a1628_0%,#080e1a_100%)] px-4 py-8 sm:px-6 lg:px-8"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <AdminHeader
        tenantName="Complejo Norte"
        onBack={onBack}
        />
        <AdminStats />
 
        <AdminQuickActions />
 
        <AdminActivityFeed />
      </div>
    </div>
  );
}