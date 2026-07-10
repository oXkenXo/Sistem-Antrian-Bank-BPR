import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Proteksi halaman kiosk, display, dan counter — harus ada parameter id_kantor
  if (["/kiosk", "/display", "/counter"].includes(pathname)) {
    const idKantor = searchParams.get("id_kantor");
    if (!idKantor || idKantor.trim() === "") {
      return NextResponse.redirect(new URL("/?error=missing_branch", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/kiosk/:path*", "/display/:path*", "/counter/:path*"],
};
