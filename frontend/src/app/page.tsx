"use client";

import Link from "next/link";
import { 
  Tv, 
  MonitorPlay, 
  Users, 
  ShieldAlert 
} from "lucide-react";

export default function PortalPage() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen flex flex-col font-sans text-[#364146]">
      {/* TopAppBar */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-16 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo Perusahaan BPR Kerta Raharja */}
            <img 
              alt="BPR Kerta Raharja Logo" 
              className="h-10 w-auto object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy_PuUGIg6TcQonvnrv6ChV2tYXRE9vUggKMMgCxgxhRuXOAR7d9HS89fGozDfGiPO7VB1_XILA462zY4-y7rIBw5IZMOMqDS39L2JBtPe3M4wqKYvHrhQ2yz9GDx4h91Ej7rQhMZePA5RMX8EKLGhANiiYcCX4oUDdB8SkCXb1XitQqo69ZO5G5lkJVH12RUQfg4srNQeClopYv2Ike-yRyP-U3N1S4HA842PFSAuFRWGmig0lFIIfXDs2kOdoj01zxU"
            />
            {/* Logo BPR Nasional */}
            <img 
              alt="BPR Logo" 
              className="h-10 w-auto object-contain" 
              src="https://lh3.googleusercontent.com/aida/AP1WRLvrPpBEMH26EO7GTocTY_KMD1TjlLHO36PMJh-oekRfNCpqp-fBJ3mM_h0WqzDjutLaXllTzKo4eGOtWKjSQoPXrO2tu-L7gxPmuowrCMXpqaOdRr68BgvdCMdcFjFuTXyZXhPWYwcbY2I4iuPkpIK_4Jvj0DZ5Ywi4Vr_sm5nVcuM3JY3qlEdaASfvVbIbsVhM79lu-tdVFjBk1Wn5xgUSEpVu2LyAsNKSHd2Vcg4e1h5NaS_uOUtOysO2"
            />
            <span className="font-heading font-bold text-xl text-[#005E60] border-l pl-4 border-gray-200 hidden sm:inline">
              Sistem Antrean Bank BPR
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center py-16 px-4">
        <div className="max-w-4xl w-full text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#005E60] mb-4">
            Portal Aplikasi Antrean
          </h1>
          <p className="text-lg text-[#576971] max-w-2xl mx-auto leading-relaxed">
            Selamat datang di Sistem Layanan Antrean BPR Kerta Raharja. Silakan pilih portal aplikasi yang ingin Anda tuju.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full">
          {/* Kiosk Card */}
          <Link 
            href="/kiosk"
            className="bg-white hover:bg-[#005E60] hover:text-white rounded-3xl p-8 border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center group active:scale-[0.98]"
          >
            <div className="w-16 h-16 bg-[#e6f2f2] text-[#005E60] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:text-white transition-colors duration-300">
              <MonitorPlay className="w-8 h-8" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-2 group-hover:text-white text-[#364146]">Kiosk Antrean</h3>
            <p className="text-sm text-[#576971] group-hover:text-white/80 leading-relaxed">
              Layar ambil nomor antrean elektronik untuk nasabah.
            </p>
          </Link>

          {/* Display Card */}
          <Link 
            href="/display"
            className="bg-white hover:bg-[#005E60] hover:text-white rounded-3xl p-8 border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center group active:scale-[0.98]"
          >
            <div className="w-16 h-16 bg-[#e6f2f2] text-[#005E60] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:text-white transition-colors duration-300">
              <Tv className="w-8 h-8" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-2 group-hover:text-white text-[#364146]">Display Utama</h3>
            <p className="text-sm text-[#576971] group-hover:text-white/80 leading-relaxed">
              Layar pemanggil nomor antrean untuk ruang tunggu/TV.
            </p>
          </Link>

          {/* Officer Card */}
          <Link 
            href="/officer"
            className="bg-white hover:bg-[#005E60] hover:text-white rounded-3xl p-8 border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center group active:scale-[0.98]"
          >
            <div className="w-16 h-16 bg-[#e6f2f2] text-[#005E60] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:text-white transition-colors duration-300">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-2 group-hover:text-white text-[#364146]">Portal Petugas</h3>
            <p className="text-sm text-[#576971] group-hover:text-white/80 leading-relaxed">
              Layar panggil & panggil ulang antrean bagi Teller/CS.
            </p>
          </Link>

          {/* Admin Card */}
          <Link 
            href="/admin"
            className="bg-white hover:bg-[#005E60] hover:text-white rounded-3xl p-8 border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center group active:scale-[0.98]"
          >
            <div className="w-16 h-16 bg-[#e6f2f2] text-[#005E60] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:text-white transition-colors duration-300">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-2 group-hover:text-white text-[#364146]">Administrator</h3>
            <p className="text-sm text-[#576971] group-hover:text-white/80 leading-relaxed">
              Layar konfigurasi, monitoring, dan laporan antrean.
            </p>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#364146] text-white py-8 border-t border-gray-800">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-16 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Box Logo Footer */}
            <div className="bg-white p-1 rounded-md flex items-center gap-2">
              <img 
                alt="BPR Kerta Raharja Logo" 
                className="h-8 w-auto object-contain" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy_PuUGIg6TcQonvnrv6ChV2tYXRE9vUggKMMgCxgxhRuXOAR7d9HS89fGozDfGiPO7VB1_XILA462zY4-y7rIBw5IZMOMqDS39L2JBtPe3M4wqKYvHrhQ2yz9GDx4h91Ej7rQhMZePA5RMX8EKLGhANiiYcCX4oUDdB8SkCXb1XitQqo69ZO5G5lkJVH12RUQfg4srNQeClopYv2Ike-yRyP-U3N1S4HA842PFSAuFRWGmig0lFIIfXDs2kOdoj01zxU"
              />
              <img 
                alt="BPR Logo" 
                className="h-8 w-auto object-contain" 
                src="https://lh3.googleusercontent.com/aida/AP1WRLvrPpBEMH26EO7GTocTY_KMD1TjlLHO36PMJh-oekRfNCpqp-fBJ3mM_h0WqzDjutLaXllTzKo4eGOtWKjSQoPXrO2tu-L7gxPmuowrCMXpqaOdRr68BgvdCMdcFjFuTXyZXhPWYwcbY2I4iuPkpIK_4Jvj0DZ5Ywi4Vr_sm5nVcuM3JY3qlEdaASfvVbIbsVhM79lu-tdVFjBk1Wn5xgUSEpVu2LyAsNKSHd2Vcg4e1h5NaS_uOUtOysO2"
              />
            </div>
            <p className="text-sm text-white/70">
              © 2024 PT BPR Kerta Raharja (Perseroda). All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
