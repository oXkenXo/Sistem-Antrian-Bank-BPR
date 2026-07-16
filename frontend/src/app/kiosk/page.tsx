"use client";

import { useState, useEffect } from "react";
import BrandLogo from "@/components/BrandLogo";
import { 
  Clock, 
  Banknote, 
  Handshake, 
  CircleHelp, 
  Ticket, 
  X, 
  Printer, 
  CheckCircle2,
  Loader2,
  CalendarDays
} from "lucide-react";
import { branchApi, queueApi } from "@/lib/api";

export default function KioskPage() {
  const [idKantor, setIdKantor] = useState<string>("01");
  const [namaKantor, setNamaKantor] = useState<string>("");
  const [ticket, setTicket] = useState<{
    number: string;
    service: string;
    time: string;
  } | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");
  const [countdown, setCountdown] = useState(6);

  // Ambil id_kantor dari query string URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id_kantor") || "01";
      setIdKantor(id);

      const fetchBranchName = async () => {
        try {
          const data = await branchApi.list();
          const current = data.find((b: any) => b.id_kantor === id);
          if (current) setNamaKantor(current.nama_kantor);
        } catch (e) {
          console.warn("Gagal memuat nama cabang di Kiosk", e);
        }
      };
      fetchBranchName();
    }
  }, []);

  // Auto-close and Countdown Timer when ticket is printed
  useEffect(() => {
    if (!ticket) return;
    setCountdown(6);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTicket(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [ticket]);

  // Live Clock & Date
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB"
      );
      setDateString(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTakeQueue = async (service: string, prefix: string) => {
    setIsPrinting(true);
    try {
      const resData = await queueApi.store({
        id_kantor: idKantor,
        service_type: service,
        prefix: prefix,
      });

      const currentTime = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB";

      setTicket({
        number: resData.data.ticket_number,
        service: service,
        time: currentTime,
      });
    } catch (error: any) {
      console.error(error);
      alert("Koneksi Error: Gagal terhubung ke server antrean BPR.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="bg-[#f8f9fa] text-[#364146] h-screen flex flex-col font-sans relative overflow-hidden select-none">
      
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#00383a] via-[#005E60] to-[#002f31]">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#008285]/20 to-transparent pointer-events-none"></div>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#009cea]/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ffff00]/5 rounded-full blur-[130px] pointer-events-none"></div>
      </div>

      {/* Top Header AppBar (Height Fixed: h-20) */}
      <header className="relative z-10 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100 h-20 flex-shrink-0 flex items-center">
        <div className="max-w-[1280px] mx-auto w-full px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 p-1.5 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
              <BrandLogo />
            </div>
            <span className="font-heading font-bold text-xl text-[#005E60] border-l pl-3 border-gray-200 hidden sm:inline tracking-tight">
              Sistem Antrean - {namaKantor || "Cabang BPR"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[#005E60]">
            <div className="flex items-center gap-2 bg-[#e6f2f2] px-4 py-1.5 rounded-xl font-bold text-xs border border-[#b2e1e3]">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>Senin - Jumat: 08:00 - 15:00</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Kiosk Area (Scroll Disabled, Strictly Fits Viewport) */}
      <main className="relative z-10 flex-grow flex flex-col justify-center items-center px-6 py-4 overflow-hidden">
        <div className="max-w-[1280px] w-full flex flex-col items-center h-full justify-around max-h-[80vh]">
          
          {/* Header Title & Date Panel */}
          <div className="text-center text-white flex flex-col items-center flex-shrink-0">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-[#ffff00] border border-white/10 px-5 py-1.5 rounded-full text-sm font-bold tracking-wide mb-4 shadow-sm">
              <CalendarDays className="w-4 h-4 text-[#ffff00]" />
              <span>Hari ini: {dateString || "Memuat Hari..."}</span>
              <span className="mx-1.5 text-white/20">|</span>
              <span className="text-white font-mono">{timeString || "00:00:00 WIB"}</span>
            </div>
            
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold mb-2 tracking-tight drop-shadow-md">
              Selamat Datang di BPR Kerta Raharja
            </h1>
            {namaKantor && (
              <h2 className="font-heading text-xl md:text-2xl font-bold text-[#ffff00] mb-3 drop-shadow-md leading-none">
                {namaKantor}
              </h2>
            )}
            <p className="text-sm md:text-base text-white/80 font-light max-w-xl leading-relaxed">
              Silakan pilih layanan di bawah ini untuk mengambil nomor antrean Anda
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl items-stretch">
            
            {/* Teller Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-[24px] shadow-xl border border-white p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:scale-[1.01] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#005E60]/5 rounded-bl-[60px] pointer-events-none"></div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#e6f2f2] text-[#005E60] rounded-xl flex items-center justify-center group-hover:bg-[#005E60] group-hover:text-white transition-all duration-300 shadow-inner">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-[#005E60] group-hover:text-[#009cea] transition-colors">Teller</h3>
                </div>
                <p className="text-gray-500 text-sm lg:text-base mb-6 leading-relaxed font-light">
                  Setoran tunai, penarikan dana, transfer antar rekening, pembayaran tagihan, serta transaksi kasir lainnya.
                </p>
              </div>
              <button 
                onClick={() => handleTakeQueue("Teller", "A")}
                disabled={isPrinting}
                className="w-full bg-gradient-to-r from-[#005E60] to-[#008285] hover:from-[#004a4c] hover:to-[#005E60] text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.97] transition-all text-lg border-b-4 border-[#00383a]"
              >
                Ambil Antrean
                <Ticket className="w-5 h-5" />
              </button>
            </div>

            {/* Kredit Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-[24px] shadow-xl border border-white p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:scale-[1.01] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#ffff00]/5 rounded-bl-[60px] pointer-events-none"></div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#ffffd0] text-[#999900] rounded-xl flex items-center justify-center group-hover:bg-[#ffff00] group-hover:text-[#364146] transition-all duration-300 shadow-inner">
                    <Handshake className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-[#005E60] group-hover:text-[#009cea] transition-colors">Kredit</h3>
                </div>
                <p className="text-gray-500 text-sm lg:text-base mb-6 leading-relaxed font-light">
                  Pengajuan kredit baru, konsultasi pinjaman, cek sisa angsuran, penyerahan berkas agunan, dan administrasi kredit.
                </p>
              </div>
              <button 
                onClick={() => handleTakeQueue("Kredit", "B")}
                disabled={isPrinting}
                className="w-full bg-gradient-to-r from-[#ffff00] to-[#ffd700] hover:from-[#e6e600] hover:to-[#e1b800] text-[#364146] rounded-xl py-4 font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.97] transition-all text-lg border-b-4 border-[#ccaa00]"
              >
                Ambil Antrean
                <Ticket className="w-5 h-5 text-[#364146]" />
              </button>
            </div>

            {/* Customer Service Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-[24px] shadow-xl border border-white p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:scale-[1.01] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#005E60]/5 rounded-bl-[60px] pointer-events-none"></div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#e6f2f2] text-[#005E60] rounded-xl flex items-center justify-center group-hover:bg-[#005E60] group-hover:text-white transition-all duration-300 shadow-inner">
                    <CircleHelp className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-[#005E60] group-hover:text-[#009cea] transition-colors">Customer Service</h3>
                </div>
                <p className="text-gray-500 text-sm lg:text-base mb-6 leading-relaxed font-light">
                  Pembukaan rekening tabungan/deposito, pendaftaran m-banking, cetak buku tabungan, ganti kartu ATM, dan pengaduan.
                </p>
              </div>
              <button 
                onClick={() => handleTakeQueue("Customer Service", "C")}
                disabled={isPrinting}
                className="w-full bg-gradient-to-r from-[#005E60] to-[#008285] hover:from-[#004a4c] hover:to-[#005E60] text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.97] transition-all text-lg border-b-4 border-[#00383a]"
              >
                Ambil Antrean
                <Ticket className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer (Height Fixed: h-16) */}
      <footer className="relative z-10 bg-white/95 backdrop-blur-md text-[#364146] h-16 flex-shrink-0 flex items-center border-t border-gray-200/50">
        <div className="max-w-[1280px] mx-auto w-full px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg border border-gray-150 flex items-center gap-2 shadow-sm">
              <BrandLogo className="scale-75 origin-left" />
            </div>
            <p className="text-xs font-semibold text-gray-500">
              © 2024 PT BPR Kerta Raharja (Perseroda).
            </p>
          </div>

        </div>
      </footer>

      {/* Loading Overlay */}
      {isPrinting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#004244]/85 backdrop-blur-md text-white animate-in fade-in duration-200">
          <div className="bg-white/10 p-6 rounded-3xl border border-white/20 flex flex-col items-center gap-3 shadow-2xl max-w-sm text-center">
            <Loader2 className="w-10 h-10 text-[#ffff00] animate-spin" />
            <h3 className="font-heading text-xl font-bold tracking-tight">Sedang Mencetak Struk</h3>
            <p className="text-xs text-white/70">Mohon tunggu sebentar, nomor antrean Anda sedang diproses...</p>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {ticket && !isPrinting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 shadow-2xl relative border border-gray-100 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setTicket(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-[#e6f2f2] text-[#005E60] rounded-full flex items-center justify-center mb-4 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-[#364146] mb-1 font-heading">Antrean Diambil</h3>
            <p className="text-xs text-gray-500 mb-4 text-center">Silakan ambil struk fisik di bawah layar mesin.</p>

            {/* Virtual Ticket UI */}
            <div className="w-full bg-[#f7f8f9] border-2 border-dashed border-gray-300 rounded-[20px] p-5 relative flex flex-col items-center shadow-inner">
              
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full"></div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full"></div>

              <div className="flex items-center gap-1.5 mb-1.5">
                <BrandLogo className="scale-75 origin-left" />
              </div>
              <span className="text-[9px] text-gray-400 tracking-wider uppercase mb-3">Struk Layanan Antrean</span>
              
              <div className="text-5xl font-extrabold tracking-tight text-[#005E60] font-mono mb-3">
                {ticket.number}
              </div>

              <div className="text-base font-bold text-gray-700 mb-1.5 font-heading">
                Layanan: {ticket.service}
              </div>

              <div className="w-full border-t border-dashed border-gray-300 my-3"></div>

              <div className="flex justify-between w-full text-[10px] text-gray-500 font-medium">
                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Tanggal:</span>
                <span className="font-semibold">{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between w-full text-[10px] text-gray-500 font-medium mt-1">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Jam Cetak:</span>
                <span className="font-semibold">{ticket.time}</span>
              </div>
            </div>

            {/* Note & Auto Close countdown indicator */}
            <div className="mt-6 flex flex-col items-center gap-2 text-center w-full">
              <span className="text-sm font-bold text-green-600 bg-green-50 border border-green-200 px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm w-full">
                <Printer className="w-4 h-4 animate-bounce" />
                Tiket sudah keluar, silakan ambil!
              </span>
              <span className="text-[11px] text-gray-400 font-medium mt-1">
                Kembali ke menu utama dalam <span className="font-bold text-[#005E60] font-mono">{countdown}</span> detik
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
