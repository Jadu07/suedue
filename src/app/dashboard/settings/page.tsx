import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { Bill } from "@/models/Bill";
import { Split } from "@/models/Split";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { PaymentRequest } from "@/models/PaymentRequest";
import UserAvatar from "@/components/UserAvatar";
import { Shield, MessageSquare, Cpu, CreditCard } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import UnsettledBillsManager, { UnsettledBillItem } from "./UnsettledBillsManager";
import WhatsAppSettingsCard from "./WhatsAppSettingsCard";
import { AppSetting } from "@/models/AppSetting";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await dbConnect();
  
  const admin = await User.findOne({ role: "ADMIN" });
  const adminName = admin?.name || "Admin";
  const adminEmail = admin?.email || process.env.DEFAULT_ADMIN_EMAIL || "yashrajchouhan14@gmail.com";
  const openwaUrl = process.env.OPENWA_URL || "https://openwa-0gjr.onrender.com";
  const pythonUrl = process.env.PYTHON_VERIFIER_URL || "http://127.0.0.1:8000";
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || "yashrajchouhan@fam";
  const yearSetting = await AppSetting.findOne({ key: "includeYearInWhatsApp" }).lean();
  const initialIncludeYear = Boolean(yearSetting?.value);

  // Query all unsettled bills with linked transaction statistics
  const unsettledBillsRaw = await Bill.find({ status: { $ne: "PAID" } }).sort({ createdAt: -1 }).lean();

  const serializedUnsettledBills: UnsettledBillItem[] = await Promise.all(
    unsettledBillsRaw.map(async (b: any) => {
      const splits = await Split.find({ billId: b._id }).lean();
      const splitIds = splits.map((s) => s._id);
      const txs = await PaymentTransaction.find({
        $or: [{ billId: b._id }, { splitId: { $in: splitIds } }]
      }).lean();
      const txAmountPaise = txs.reduce((sum: number, t: any) => sum + (t.amountPaise || 0), 0);
      const reqCount = await PaymentRequest.countDocuments({
        $or: [{ billId: b._id }, { splitId: { $in: splitIds } }, { splitIds: { $in: splitIds } }]
      });

      return {
        _id: b._id.toString(),
        title: b.title,
        description: b.description || "",
        date: b.date ? b.date.toISOString() : b.createdAt.toISOString(),
        totalAmountPaise: b.totalAmountPaise,
        status: b.status,
        splitsCount: splits.length,
        transactionsCount: txs.length,
        transactionsAmountPaise: txAmountPaise,
        requestsCount: reqCount
      };
    })
  );

  return (
    <div className="p-md md:p-huge max-w-4xl mx-auto space-y-lg">
      {/* Header */}
      <div className="space-y-1 pt-1 md:pt-0">
        <h1 className="text-2xl md:display-lg text-ink font-black tracking-tight">Settings</h1>
        <p className="text-xs text-ink-mute max-w-xl">
          System configuration, admin profile, and automation services.
        </p>
      </div>

      {/* Admin Profile Card */}
      <div className="bg-canvas border border-hairline rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-ink" />
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider text-[11px]">
              Admin Details
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-canvas-soft border border-hairline text-ink">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Active Admin
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <UserAvatar name={adminName} size="lg" />
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-base font-black text-ink truncate">{adminName}</h3>
              <p className="text-xs text-ink-mute font-mono truncate">{adminEmail}</p>
              <p className="text-[11px] text-ink-faint">Role: System Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WhatsApp API (OpenWA) */}
        <div className="bg-canvas border border-hairline rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-ink" />
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider text-[11px]">
                  WhatsApp API (OpenWA)
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-canvas-soft border border-hairline text-ink">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Configured
              </span>
            </div>
            <p className="text-xs text-ink-mute leading-relaxed">
              Automated payment reminders and message dispatching via OpenWA headless service.
            </p>
          </div>

          <div className="bg-canvas-soft border border-hairline rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-ink-mute text-[11px]">Endpoint</span>
              <span className="font-mono text-ink text-[11px] truncate max-w-[200px]">
                {openwaUrl}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-mute text-[11px]">Session ID</span>
              <span className="font-mono text-ink text-[11px]">Connected</span>
            </div>
          </div>
        </div>

        {/* FamPay Python Service (IMAP IDLE) */}
        <div className="bg-canvas border border-hairline rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-ink" />
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider text-[11px]">
                  FamPay Python Service
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-canvas-soft border border-hairline text-ink">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                IMAP IDLE
              </span>
            </div>
            <p className="text-xs text-ink-mute leading-relaxed">
              Instant push notification listener with sub-millisecond in-memory lookup.
            </p>
          </div>

          <div className="bg-canvas-soft border border-hairline rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-ink-mute text-[11px]">Engine URL</span>
              <span className="font-mono text-ink text-[11px]">{pythonUrl}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-mute text-[11px]">Listening Inbox</span>
              <span className="font-mono text-ink text-[11px]">yashrajchouhan14@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Defaults Card */}
      <div className="bg-canvas border border-hairline rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-hairline">
          <CreditCard className="w-4 h-4 text-ink" />
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider text-[11px]">
            Payment Defaults
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-canvas-soft border border-hairline rounded-xl p-3">
            <span className="text-[11px] text-ink-mute font-semibold uppercase tracking-wider block">Receiving UPI ID</span>
            <p className="font-mono font-bold text-ink text-sm mt-1">{upiId}</p>
          </div>
          <div className="bg-canvas-soft border border-hairline rounded-xl p-3">
            <span className="text-[11px] text-ink-mute font-semibold uppercase tracking-wider block">Currency</span>
            <p className="font-bold text-ink text-sm mt-1">INR (₹)</p>
          </div>
          <div className="bg-canvas-soft border border-hairline rounded-xl p-3">
            <span className="text-[11px] text-ink-mute font-semibold uppercase tracking-wider block">Verification Method</span>
            <p className="font-bold text-ink text-sm mt-1">UPI Token + UTR</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Message Preferences */}
      <WhatsAppSettingsCard initialIncludeYear={initialIncludeYear} />

      {/* Danger Zone: Unsettled Bills Management */}
      <UnsettledBillsManager initialBills={serializedUnsettledBills} />

      {/* Mobile Sign Out Action */}
      <div className="md:hidden pt-1">
        <LogoutButton
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-canvas border border-hairline hover:border-red-200 rounded-2xl text-red-600 font-bold text-xs active:scale-[0.98] transition shadow-2xs"
          iconSize={16}
          text="Log Out"
        />
      </div>
    </div>
  );
}
