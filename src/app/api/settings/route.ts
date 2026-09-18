import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { AppSetting } from "@/models/AppSetting";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const settings = await AppSetting.find().lean();
    const settingsMap: Record<string, any> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    return NextResponse.json({ success: true, settings: settingsMap });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { key, value } = await req.json();
    if (!key) {
      return NextResponse.json({ error: "Setting key is required" }, { status: 400 });
    }

    const updated = await AppSetting.findOneAndUpdate(
      { key },
      { $set: { value } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, setting: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
