import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import DashboardLayoutClient from "./DashboardLayoutClient";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await dbConnect();
  const admin = await User.findOne({ role: "ADMIN" }).lean();
  const adminName = admin?.name || "Yashraj";

  return (
    <DashboardLayoutClient adminName={adminName}>
      {children}
    </DashboardLayoutClient>
  );
}
