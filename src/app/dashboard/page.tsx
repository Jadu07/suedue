import { DollarSign, Briefcase, FileText, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import dbConnect from "@/lib/db";
import { Bill } from "@/models/Bill";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { Person } from "@/models/Person";
import { Split } from "@/models/Split";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  await dbConnect();

  // 1. TOTAL COLLECTED
  const verifiedTransactions = await PaymentTransaction.find({ status: "VERIFIED" }).lean();
  const totalCollectedPaise = verifiedTransactions.reduce((acc, t: any) => acc + (t.amountPaise || 0), 0);
  const totalCollectedFormatted = `₹${(totalCollectedPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // 2. ACTIVE GROUPS (BILLS)
  const activeBillsCount = await Bill.countDocuments({ status: { $in: ["OPEN", "PARTIALLY_PAID"] } });

  // 3. TOTAL MEMBERS
  const totalMembersCount = await Person.countDocuments({ isActive: true });

  // 4. PENDING DUES
  // Total pending is total bill amounts minus total verified transactions
  const allBills = await Bill.find({ status: { $ne: "CANCELLED" } }).lean();
  const totalBillAmountPaise = allBills.reduce((acc, b: any) => acc + (b.totalAmountPaise || 0), 0);
  const totalPendingPaise = Math.max(0, totalBillAmountPaise - totalCollectedPaise);
  const totalPendingFormatted = `₹${(totalPendingPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // RECENT ACTIVITY
  const recentTransactions = await PaymentTransaction.find({ status: { $in: ["VERIFIED", "PENDING"] } })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("personId")
    .lean();

  const recentActivity = recentTransactions.map((t: any) => {
    return {
      id: t._id.toString(),
      name: t.personId?.name || "Unknown Person",
      action: t.status === "VERIFIED" ? "paid their dues" : "initiated a payment",
      amount: `+₹${(t.amountPaise / 100).toFixed(2)}`,
      time: new Date(t.createdAt).toLocaleDateString() + " " + new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: t.status === "VERIFIED" ? "text-emerald-500" : "text-yellow-500"
    };
  });

  // Calculate monthly stats for the chart (last 6 months)
  const now = new Date();
  const monthlyStats = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      month: d.toLocaleString('default', { month: 'short' }),
      totalPaise: 0
    };
  });

  verifiedTransactions.forEach((t: any) => {
    const tDate = new Date(t.createdAt);
    // Only include if within the last 6 months
    const monthDiff = (now.getFullYear() - tDate.getFullYear()) * 12 + now.getMonth() - tDate.getMonth();
    if (monthDiff >= 0 && monthDiff < 6) {
      const idx = 5 - monthDiff;
      monthlyStats[idx].totalPaise += t.amountPaise || 0;
    }
  });

  const maxMonthValue = Math.max(...monthlyStats.map(m => m.totalPaise), 10000); // minimum scale

  // Month-over-month calculation for cards
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const calcPct = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? "+100%" : "0%";
    const diff = ((curr - prev) / prev) * 100;
    return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
  };

  const currentCollected = verifiedTransactions.filter(t => new Date(t.createdAt) >= currentMonthStart).reduce((acc, t: any) => acc + (t.amountPaise || 0), 0);
  const lastCollected = verifiedTransactions.filter(t => {
    const d = new Date(t.createdAt);
    return d >= lastMonthStart && d < currentMonthStart;
  }).reduce((acc, t: any) => acc + (t.amountPaise || 0), 0);
  const collectedDiff = calcPct(currentCollected, lastCollected);

  const allActiveBills = allBills.filter(b => b.status === "OPEN" || b.status === "PARTIALLY_PAID");
  const currentActiveBills = allActiveBills.filter(b => new Date(b.createdAt) >= currentMonthStart).length;
  const lastActiveBills = allActiveBills.filter(b => {
    const d = new Date(b.createdAt);
    return d >= lastMonthStart && d < currentMonthStart;
  }).length;
  const activeBillsDiff = currentActiveBills - lastActiveBills;
  
  const currentBillsPaise = allBills.filter(b => new Date(b.createdAt) >= currentMonthStart).reduce((acc, b: any) => acc + (b.totalAmountPaise || 0), 0);
  const lastBillsPaise = allBills.filter(b => {
    const d = new Date(b.createdAt);
    return d >= lastMonthStart && d < currentMonthStart;
  }).reduce((acc, b: any) => acc + (b.totalAmountPaise || 0), 0);
  const currentPendingCreated = Math.max(0, currentBillsPaise - currentCollected);
  const lastPendingCreated = Math.max(0, lastBillsPaise - lastCollected);
  const pendingDiff = calcPct(currentPendingCreated, lastPendingCreated);

  const allMembers = await Person.find({ isActive: true }).lean();
  const currentMembers = allMembers.filter((p: any) => new Date(p.createdAt) >= currentMonthStart).length;
  const lastMembers = allMembers.filter((p: any) => {
    const d = new Date(p.createdAt);
    return d >= lastMonthStart && d < currentMonthStart;
  }).length;
  const membersDiff = currentMembers - lastMembers;

  const admin = await User.findOne({ role: "ADMIN" }).lean();
  const adminName = admin?.name || "Yashraj";

  // Dynamic greeting based on Indian Standard Time
  const istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istHour = new Date(istTime).getHours();
  let greeting = "Good Evening";
  if (istHour < 12) {
    greeting = "Good Morning";
  } else if (istHour < 18) {
    greeting = "Good Afternoon";
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">{greeting}, {adminName.split(' ')[0]}!</h1>
        <p className="text-gray-400 mt-1">Here's what's happening with your shared bills today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#161616] border border-[#333] p-4 md:p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <h3 className="text-[10px] md:text-xs font-bold text-gray-400 tracking-wider truncate mr-1">TOTAL COLLECTED</h3>
            <span className="w-4 h-4 text-gray-500 flex items-center justify-center font-bold">₹</span>
          </div>
          <div className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2 truncate">{totalCollectedFormatted}</div>
          <div className="flex flex-wrap items-center gap-1 text-[10px] md:text-xs font-medium">
            <span className={collectedDiff.startsWith('+') && collectedDiff !== '+0.0%' && collectedDiff !== '0%' ? 'text-green-500' : collectedDiff === '0%' ? 'text-gray-500' : 'text-red-400'}>{collectedDiff}</span>
            <span className="text-gray-500">vs last month</span>
          </div>
        </div>

        <div className="bg-[#161616] border border-[#333] p-4 md:p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <h3 className="text-[10px] md:text-xs font-bold text-gray-400 tracking-wider truncate mr-1">ACTIVE GROUPS</h3>
            <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
          </div>
          <div className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">{activeBillsCount}</div>
          <div className="flex flex-wrap items-center gap-1 text-[10px] md:text-xs font-medium">
            <span className={activeBillsDiff > 0 ? 'text-green-500' : activeBillsDiff < 0 ? 'text-red-400' : 'text-gray-500'}>{activeBillsDiff > 0 ? `+${activeBillsDiff}` : activeBillsDiff}</span>
            <span className="text-gray-500">vs last month</span>
          </div>
        </div>

        <div className="bg-[#161616] border border-[#333] p-4 md:p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <h3 className="text-[10px] md:text-xs font-bold text-gray-400 tracking-wider truncate mr-1">PENDING DUES</h3>
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
          </div>
          <div className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2 truncate">{totalPendingFormatted}</div>
          <div className="flex flex-wrap items-center gap-1 text-[10px] md:text-xs font-medium">
            <span className={pendingDiff.startsWith('+') && pendingDiff !== '+0.0%' && pendingDiff !== '0%' ? 'text-red-400' : pendingDiff === '0%' ? 'text-gray-500' : 'text-green-500'}>{pendingDiff}</span>
            <span className="text-gray-500">vs last month</span>
          </div>
        </div>

        <div className="bg-[#161616] border border-[#333] p-4 md:p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <h3 className="text-[10px] md:text-xs font-bold text-gray-400 tracking-wider truncate mr-1">TOTAL MEMBERS</h3>
            <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
          </div>
          <div className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">{totalMembersCount}</div>
          <div className="flex flex-wrap items-center gap-1 text-[10px] md:text-xs font-medium">
            <span className={membersDiff > 0 ? 'text-green-500' : membersDiff < 0 ? 'text-red-400' : 'text-gray-500'}>{membersDiff > 0 ? `+${membersDiff}` : membersDiff}</span>
            <span className="text-gray-500">vs last month</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Overview Chart */}
        <div className="lg:col-span-2 bg-[#161616] border border-[#333] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Collections Overview (Last 6 Months)</h3>
          <div className="h-64 flex items-end justify-between gap-4 border-b border-[#333] pb-2 px-2 relative">
            {monthlyStats.map((stat, i) => {
              const heightPercent = stat.totalPaise === 0 ? 2 : Math.max(5, (stat.totalPaise / maxMonthValue) * 100);
              return (
                <div key={i} className="flex-1 flex justify-center group relative h-full items-end">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-[#222] border border-[#444] text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity z-10">
                    ₹{(stat.totalPaise / 100).toFixed(2)}
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-full max-w-[40px] bg-[#333] group-hover:bg-[#a5d8ce] transition-colors rounded-t-sm" 
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 px-2">
            {monthlyStats.map((stat, i) => (
              <span key={i} className="flex-1 text-center">{stat.month}</span>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#161616] border border-[#333] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {recentActivity.length === 0 ? (
              <div className="text-gray-500 text-sm italic">No recent activity</div>
            ) : (
              recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{activity.name}</div>
                    <div className="text-xs text-gray-400">{activity.action}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${activity.color}`}>{activity.amount}</div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
