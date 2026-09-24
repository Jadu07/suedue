import React from "react";
import { Globe, Edit2, Link as LinkIcon, UserCircle } from "lucide-react";

import dbConnect from "@/lib/db";
import { User } from "@/models/User";

export default async function ProfilePage() {
  await dbConnect();
  const admin = await User.findOne({ role: "ADMIN" }).lean();
  
  const adminName = admin?.name || "Admin User";
  const adminEmail = admin?.email || "admin@example.com";
  const avatarUrl = admin?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=161616&color=fff`;
  
  const firstName = adminName.split(' ')[0] || "";
  const lastName = adminName.split(' ').slice(1).join(' ') || "";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#161616] border border-[#333] rounded-xl p-6">
        <h1 className="text-xl font-bold text-white">User Profile</h1>
        <div className="text-sm text-gray-400">
          Home <span className="mx-2">&gt;</span> <span className="text-white">User Profile</span>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-[#161616] border border-[#333] rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#333]">
            <img src={avatarUrl} alt={adminName} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{adminName}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
              <span>Administrator</span>
              <span className="w-1 h-1 rounded-full bg-gray-500"></span>
              <span>System Owner</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#222] transition-colors">
            <UserCircle size={18} />
          </button>
          <button className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#222] transition-colors">
            <LinkIcon size={18} />
          </button>
          <button className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#222] transition-colors">
            <Globe size={18} />
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-[#161616] border border-[#333] rounded-xl p-6 relative">
          <h3 className="text-lg font-bold text-white mb-6">Personal Information</h3>
          
          <div className="grid grid-cols-2 gap-y-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">First Name</div>
              <div className="text-sm text-white font-medium">{firstName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Last Name</div>
              <div className="text-sm text-white font-medium">{lastName || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Email</div>
              <div className="text-sm text-white font-medium">{adminEmail}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Role</div>
              <div className="text-sm text-white font-medium">Administrator</div>
            </div>
          </div>

          <button className="absolute bottom-6 right-6 bg-[#a5d8ce] text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#8ec2b8] transition-colors">
            <Edit2 size={14} /> Edit
          </button>
        </div>

        {/* Address Details Placeholder */}
        <div className="bg-[#161616] border border-[#333] rounded-xl p-6 relative">
          <h3 className="text-lg font-bold text-white mb-6">System Access</h3>
          
          <div className="grid grid-cols-2 gap-y-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <div className="text-sm text-emerald-400 font-medium">Active</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Permissions</div>
              <div className="text-sm text-white font-medium">Full Control</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Last Login</div>
              <div className="text-sm text-white font-medium">Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
