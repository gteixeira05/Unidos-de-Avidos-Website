import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/auth";
import { getSessionCookieOptions } from "@/lib/session-cookie";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(getSessionCookieName(), "", getSessionCookieOptions(0));
  return res;
}

