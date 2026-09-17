import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    // STRICT DATABASE VERIFICATION ONLY
    const user = await User.findOne({ email, role: "ADMIN" });
    
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await encrypt({ email, role: "ADMIN" });

    const proto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https") ? "https" : "http");
    const isHttps = proto === "https";

    (await cookies()).set("session", session, {
      expires,
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
