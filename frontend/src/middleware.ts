import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Config to specify which paths the middleware runs on (optional)
export const config = {
  matcher: [],
};
