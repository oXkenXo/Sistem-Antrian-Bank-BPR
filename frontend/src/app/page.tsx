"use client";

import Link from "next/link";
import { Tv, Users, MonitorPlay } from "lucide-react";

export default function PortalPage() {
  return (
    <div className="bg-[#00383a] text-white min-h-screen flex flex-col justify-center items-center font-sans p-6 relative overflow-hidden select-none">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#00383a] via-[#005E60] to-[#002f31]">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#008285]/20 to-transparent pointer-events-none"></div>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#009cea]/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ffff00]/5 rounded-full blur-[130px] pointer-events-none"></div>
      </div>

      <div className="z-10 w-full max-w-md flex flex-col items-center">
        {/* Company Logo Banner */}
        <div className="flex items-center gap-3 mb-10 bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 shadow-lg">
          <img 
            alt="BPR Kerta Raharja Logo" 
            className="h-10 w-auto object-contain bg-white rounded-lg p-1" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy_PuUGIg6TcQonvnrv6ChV2tYXRE9vUggKMMgCxgxhRuXOAR7d9HS89fGozDfGiPO7VB1_XILA462zY4-y7rIBw5IZMOMqDS39L2JBtPe3M4wqKYvHrhQ2yz9GDx4h91Ej7rQhMZePA5RMX8EKLGhANiiYcCX4oUDdB8SkCXb1XitQqo69ZO5G5lkJVH12RUQfg4srNQeClopYv2Ike-yRyP-U3N1S4HA842PFSAuFRWGmig0lFIIfXDs2kOdoj01zxU"
          />
          <span className="font-heading font-extrabold text-lg text-white border-l pl-3 border-white/20">
            BPR Kerta Raharja
          </span>
        </div>

        {/* Title Info */}
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight mb-2">Portal Sistem Antrean</h1>
          <p className="text-slate-300 text-xs uppercase tracking-widest font-bold">Pilih Layanan Sistem</p>
        </div>

        {/* Wireframe: page awal (3 Buttons Stacked) */}
        <div className="flex flex-col gap-5 w-full">
          
          {/* Dashboard Button */}
          <Link 
            href="/display"
            className="group flex items-center justify-between bg-white hover:bg-[#005E60] hover:text-white rounded-[24px] px-8 py-5 border border-white/5 shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#005E60] group-hover:bg-white text-white group-hover:text-[#005E60] rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md">
                <Tv className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-sm font-extrabold group-hover:text-white text-[#364146] block leading-none">
                  Dashboard
                </span>
                <span className="text-[10px] text-gray-400 group-hover:text-teal-200 mt-1 block">
                  Layar Monitor Utama / TV
                </span>
              </div>
            </div>
          </Link>

          {/* Petugas Button */}
          <Link 
            href="/counter"
            className="group flex items-center justify-between bg-white hover:bg-[#005E60] hover:text-white rounded-[24px] px-8 py-5 border border-white/5 shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#005E60] group-hover:bg-white text-white group-hover:text-[#005E60] rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-sm font-extrabold group-hover:text-white text-[#364146] block leading-none">
                  Petugas
                </span>
                <span className="text-[10px] text-gray-400 group-hover:text-teal-200 mt-1 block">
                  Login & Kelola Antrean Loket
                </span>
              </div>
            </div>
          </Link>

          {/* Nasabah Button */}
          <Link 
            href="/kiosk"
            className="group flex items-center justify-between bg-white hover:bg-[#005E60] hover:text-white rounded-[24px] px-8 py-5 border border-white/5 shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#005E60] group-hover:bg-white text-white group-hover:text-[#005E60] rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md">
                <MonitorPlay className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-sm font-extrabold group-hover:text-white text-[#364146] block leading-none">
                  Nasabah
                </span>
                <span className="text-[10px] text-gray-400 group-hover:text-teal-200 mt-1 block">
                  Kiosk Cetak Tiket Antrean
                </span>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
