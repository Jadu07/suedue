import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { Bill } from "@/models/Bill";
import { Split } from "@/models/Split";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { PaymentRequest } from "@/models/PaymentRequest";
import UserAvatar from "@/components/UserAvatar";
import { Shield, MessageSquare, Cpu, CreditCard } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import WhatsAppSettingsCard from "./WhatsAppSettingsCard";
import { AppSetting } from "@/models/AppSetting";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await dbConnect();
  
  const [admin, yearSetting] = await Promise.all([
    User.findOne({ role: "ADMIN" }).lean(),
    AppSetting.findOne({ key: "includeYearInWhatsApp" }).lean(),
  ]);
  const adminName = admin?.name || "Admin";
  const adminEmail = admin?.email || process.env.DEFAULT_ADMIN_EMAIL || "yashrajchouhan27@gmail.com";
  const openwaUrl = process.env.OPENWA_URL || "https://openwa-0gjr.onrender.com";
  const pythonUrl = process.env.PYTHON_VERIFIER_URL || "http://127.0.0.1:8000";
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || "yashrajchouhan@fam";
  const initialIncludeYear = Boolean(yearSetting?.value);

  // Removed unused UnsettledBills raw fetch from here.

  return (
    <div className="p-md md:p-huge max-w-4xl mx-auto space-y-lg">
      {/* Header */}
      <div className="space-y-1 pt-1 md:pt-0">
        <h1 className="text-2xl md:display-lg text-white font-black tracking-tight">Settings</h1>
        <p className="text-xs text-gray-400 max-w-xl">
          System configuration, admin profile, and automation services.
        </p>
      </div>

      {/* Admin Profile Card */}
      <div className="bg-[#161616] border border-[#333] rounded-2xl p-5 sm:p-6  space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#333]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-white" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">
              Admin Details
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1a1a1a] border border-[#333] text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Active Admin
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <UserAvatar name={adminName} size="lg" />
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-base font-black text-white truncate">{adminName}</h3>
              <p className="text-xs text-gray-400 font-mono truncate">{adminEmail}</p>
              <p className="text-[11px] text-gray-500">Role: System Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Grid Removed */}

      {/* Payment Defaults Card */}
      <div className="bg-[#161616] border border-[#333] rounded-2xl p-5 sm:p-6  space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-[#333]">
          <CreditCard className="w-4 h-4 text-white" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider text-[11px]">
            Payment Defaults
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">Receiving UPI ID</span>
            <p className="font-mono font-bold text-white text-sm mt-1">{upiId}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">Currency</span>
            <p className="font-bold text-white text-sm mt-1">INR (₹)</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">Verification Method</span>
            <p className="font-bold text-white text-sm mt-1">UPI Token + UTR</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Message Preferences */}
      <WhatsAppSettingsCard initialIncludeYear={initialIncludeYear} />

      {/* Danger Zone: Unsettled Bills Management Removed from here (Moved to individual Bill pages) */}

      {/* Mobile Sign Out Action */}
      <div className="md:hidden pt-1">
        <LogoutButton
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#161616] border border-[#333] hover:border-red-200 rounded-2xl text-red-600 font-bold text-xs active:scale-[0.98] transition "
          iconSize={16}
          text="Log Out"
        />
      </div>
    </div>
  );
}
