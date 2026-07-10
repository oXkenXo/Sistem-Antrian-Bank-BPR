"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Tv, 
  Users, 
  MonitorPlay, 
  HelpCircle, 
  ChevronRight,
  X,
  MapPin,
  Building,
  CalendarDays,
  Lock,
  UserCheck,
  Eye,
  EyeOff
} from "lucide-react";

interface Branch {
  id_kantor: string;
  nama_kantor: string;
  alamat: string | null;
  gambar_kantor: string | null;
}

// Fallback jika backend belum terhubung/migrasi belum selesai
const defaultBranches: Branch[] = [
  { id_kantor: "01", nama_kantor: "Kantor Pusat (Soreang)", alamat: "Jl. Raya Soreang No. 12, Soreang", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/02.jpg" },
  { id_kantor: "02", nama_kantor: "Kantor Cabang Banjaran", alamat: "Jl. Raya Banjaran No. 45, Banjaran", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/03.jpg" },
  { id_kantor: "03", nama_kantor: "Kantor Cabang Ciparay", alamat: "Jl. Raya Ciparay No. 88, Ciparay", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
  { id_kantor: "04", nama_kantor: "Kantor Cabang Majalaya", alamat: "Jl. Raya Majalaya No. 101, Majalaya", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
  { id_kantor: "05", nama_kantor: "Kantor Cabang Rancaekek", alamat: "Jl. Raya Rancaekek No. 54, Rancaekek", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
  { id_kantor: "06", nama_kantor: "Kantor Cabang Cicalengka", alamat: "Jl. Raya Cicalengka No. 120, Cicalengka", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
  { id_kantor: "07", nama_kantor: "Kantor Cabang Baleendah", alamat: "Jl. Raya Baleendah No. 210, Baleendah", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
  { id_kantor: "08", nama_kantor: "Kantor Cabang Pangalengan", alamat: "Jl. Raya Pangalengan No. 34, Pangalengan", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
  { id_kantor: "09", nama_kantor: "Kantor Cabang Ciwidey", alamat: "Jl. Raya Ciwidey No. 77, Ciwidey", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
  { id_kantor: "10", nama_kantor: "Kantor Cabang Margahayu", alamat: "Jl. Raya Kopo Sayati No. 15, Margahayu", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
  { id_kantor: "11", nama_kantor: "Kantor Cabang Dayeuhkolot", alamat: "Jl. Raya Dayeuhkolot No. 143, Dayeuhkolot", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
  { id_kantor: "12", nama_kantor: "Kantor Cabang Katapang", alamat: "Jl. Raya Katapang No. 99, Katapang", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
  { id_kantor: "13", nama_kantor: "Kantor Cabang Cileunyi", alamat: "Jl. Raya Cileunyi No. 202, Cileunyi", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
  { id_kantor: "14", nama_kantor: "Kantor Cabang Bojongsoang", alamat: "Jl. Raya Bojongsoang No. 66, Bojongsoang", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
  { id_kantor: "15", nama_kantor: "Kantor Cabang Pacet", alamat: "Jl. Raya Pacet No. 12, Pacet", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
  { id_kantor: "16", nama_kantor: "Kantor Cabang Cimaung", alamat: "Jl. Raya Cimaung No. 40, Cimaung", gambar_kantor: "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg" },
];

export default function PortalPage() {
  const [branches, setBranches] = useState<Branch[]>(defaultBranches);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  
  // Login Gatekeeper States
  const [loginStep, setLoginStep] = useState<"login" | "services">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const [showHelp, setShowHelp] = useState(false);

  // Ambil cabang dari API Backend secara dinamis
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/branches");
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setBranches(data);
          }
        }
      } catch (e) {
        console.warn("Backend offline, menggunakan data cabang fallback.", e);
      }
    };
    fetchBranches();
  }, []);

  const handleBranchClick = (branch: Branch) => {
    setSelectedBranch(branch);
    // Reset login states
    setLoginStep("login");
    setEmail("");
    setPassword("");
    setErrorMessage(null);
    setLoggedInUser(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!selectedBranch) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
          id_kantor: selectedBranch.id_kantor,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || "Gagal masuk layanan cabang.");
      }

      // Simpan user info ke sessionStorage dengan key spesifik cabang
      sessionStorage.setItem(`user_${selectedBranch.id_kantor}`, JSON.stringify(resData.user));
      setLoggedInUser(resData.user);
      setLoginStep("services");
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f8f9fa] text-[#364146] min-h-screen flex flex-col font-sans relative overflow-hidden select-none">
      
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#00383a] via-[#005E60] to-[#002f31] pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#008285]/20 to-transparent pointer-events-none"></div>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#009cea]/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ffff00]/5 rounded-full blur-[130px] pointer-events-none"></div>
      </div>

      {/* Top Header AppBar */}
      <header className="relative z-10 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100 h-20 flex-shrink-0 flex items-center">
        <div className="max-w-[1280px] mx-auto w-full px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 p-1.5 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
              <img 
                alt="BPR Kerta Raharja Logo" 
                className="h-8 w-auto object-contain" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWWqcEz9_E2hC6He-3hzy5h5plVGE-UI0_ced8dFnN44m46QCPpYAqUJxHULP3TJ_TI7JN_TEXtPC7A--qD0qw6BJ5G3j8FsYA9L9ev4mQaGEEQcF2XXALmSdfuvpXMfhUyZZ_cDNFKvq-3TS2oMtJvz9oPYGCuJfJdCQYEdcdN_f8e_O8PKheajbXG3CubYlDXDekJugqCvjVWD-Hpi40ki-yVJaiN0oOM-wOVz4TFefVa6I25IETAsJYLXb8OiMvAbE"
              />
              <img 
                alt="BPR Logo" 
                className="h-8 w-auto object-contain border-l pl-2 border-gray-200" 
                src="https://lh3.googleusercontent.com/aida/AP1WRLvrPpBEMH26EO7GTocTY_KMD1TjlLHO36PMJh-oekRfNCpqp-fBJ3mM_h0WqzDjutLaXllTzKo4eGOtWKjSQoPXrO2tu-L7gxPmuowrCMXpqaOdRr68BgvdCMdcFjFuTXyZXhPWYwcbY2I4iuPkpIK_4Jvj0DZ5Ywi4Vr_sm5nVcuM3JY3qlEdaASfvVbIbsVhM79lu-tdVFjBk1Wn5xgUSEpVu2LyAsNKSHd2Vcg4e1h5NaS_uOUtOysO2"
              />
            </div>
            <span className="font-heading font-bold text-xl text-[#005E60] border-l pl-3 border-gray-200 hidden sm:inline tracking-tight">
              Portal Layanan Cabang
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowHelp(true)}
              className="bg-[#e6f2f2] text-[#005E60] px-4 py-2 rounded-xl flex items-center gap-2 border border-[#b2e1e3] hover:bg-[#d0e8e8] transition-all cursor-pointer font-bold text-xs uppercase tracking-wider"
            >
              <HelpCircle className="w-4 h-4 text-[#005E60]" />
              <span>Informasi</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="relative z-10 flex-grow flex flex-col items-center px-6 py-12 max-w-[1280px] mx-auto w-full">
        
        {/* Title and Date Panel */}
        <div className="text-center text-white flex flex-col items-center flex-shrink-0 mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-[#ffff00] border border-white/10 px-5 py-1.5 rounded-full text-sm font-bold tracking-wide mb-4 shadow-sm">
            <CalendarDays className="w-4 h-4 text-[#ffff00]" />
            <span>Pilih Kantor Jaringan Layanan</span>
          </div>
          
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold mb-2 tracking-tight drop-shadow-md">
            Sistem Informasi Antrean Terpadu
          </h1>
          <p className="text-sm md:text-base text-white/80 font-light max-w-xl leading-relaxed">
            Silakan pilih kantor cabang tujuan Anda di bawah untuk membuka Kiosk Nasabah, Layar TV Display, atau Panel Petugas Loket.
          </p>
        </div>

        {/* Selection Grid (Premium White/Glass Card style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full items-stretch">
          {branches.map((branch) => (
            <div 
              key={branch.id_kantor}
              onClick={() => handleBranchClick(branch)}
              className="bg-white/95 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-white flex flex-col cursor-pointer group"
            >
              <div className="h-40 w-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                {branch.gambar_kantor ? (
                  <img 
                    alt={branch.nama_kantor} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src={branch.gambar_kantor}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg";
                    }}
                  />
                ) : (
                  <Building className="w-12 h-12 text-slate-300" />
                )}
                <div className="absolute top-3 left-3 bg-[#005E60] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-sm">
                  KODE: {branch.id_kantor}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-grow justify-between border-t-4 border-[#005E60] bg-white">
                <h3 className="font-heading font-bold text-base text-[#005E60] group-hover:text-[#009cea] transition-colors leading-snug">
                  {branch.nama_kantor}
                </h3>
                {branch.alamat && (
                  <p className="text-gray-400 text-xs mt-2 flex items-start gap-1 font-light leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{branch.alamat}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-white/95 backdrop-blur-md text-[#364146] h-16 flex-shrink-0 flex items-center border-t border-gray-200/50">
        <div className="max-w-[1280px] mx-auto w-full px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg border border-gray-150 flex items-center gap-2 shadow-sm">
              <img 
                alt="BPR Kerta Raharja Logo" 
                className="h-6 w-auto object-contain" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWWqcEz9_E2hC6He-3hzy5h5plVGE-UI0_ced8dFnN44m46QCPpYAqUJxHULP3TJ_TI7JN_TEXtPC7A--qD0qw6BJ5G3j8FsYA9L9ev4mQaGEEQcF2XXALmSdfuvpXMfhUyZZ_cDNFKvq-3TS2oMtJvz9oPYGCuJfJdCQYEdcdN_f8e_O8PKheajbXG3CubYlDXDekJugqCvjVWD-Hpi40ki-yVJaiN0oOM-wOVz4TFefVa6I25IETAsJYLXb8OiMvAbE"
              />
            </div>
            <p className="text-xs font-semibold text-gray-500">
              © 2024 PT BPR Kerta Raharja (Perseroda). All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* LOGIN & SERVICES MODAL */}
      {selectedBranch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          
          {/* STEP 1: LOGIN FORM */}
          {loginStep === "login" ? (
            <form 
              onSubmit={handleLogin}
              className="bg-white/95 backdrop-blur-md rounded-[28px] w-full max-w-md p-8 shadow-2xl border border-white flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setSelectedBranch(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-gray-700 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header info */}
              <div className="flex items-center gap-4 mb-6 border-b pb-5">
                <div className="bg-[#e6f2f2] p-3 rounded-2xl text-[#005E60] shadow-inner">
                  <Lock className="w-8 h-8 text-[#005E60]" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-[#005E60] font-extrabold uppercase tracking-widest block">Autentikasi</span>
                  <h3 className="text-lg font-heading font-extrabold text-[#005E60] leading-tight">
                    {selectedBranch.nama_kantor}
                  </h3>
                </div>
              </div>

              <p className="text-gray-500 text-xs mb-6 text-left leading-relaxed">
                Silakan login untuk mengakses layanan antrean dan counter pada cabang ini.
              </p>

              {/* Error Banner */}
              {errorMessage && (
                <div className="bg-red-50 text-red-700 text-xs font-semibold p-4 rounded-xl border border-red-200 mb-4 text-left leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-col gap-4 text-left">
                {/* Email Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Petugas / Admin</label>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`petugas${selectedBranch.id_kantor}@bpr.co.id`}
                    className="border border-gray-200 bg-slate-50 text-gray-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005E60] focus:bg-white transition-all shadow-sm"
                  />
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Kata Sandi</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border border-gray-200 bg-slate-50 text-gray-800 rounded-xl pl-4 pr-12 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005E60] focus:bg-white transition-all shadow-sm w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 w-full bg-gradient-to-r from-[#005E60] to-[#008285] hover:from-[#004a4c] hover:to-[#005E60] text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all text-lg border-b-4 border-[#00383a] disabled:opacity-50"
                >
                  {isLoading ? "Memverifikasi..." : "Login & Masuk"}
                </button>
              </div>
            </form>
          ) : (
            
            /* STEP 2: SERVICES SELECTION MENU (AFTER SUCCESSFUL LOGIN) */
            <div className="bg-white/95 backdrop-blur-md rounded-[28px] w-full max-w-md p-8 shadow-2xl border border-white flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
              
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setSelectedBranch(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-gray-700 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header info */}
              <div className="flex items-center gap-4 mb-6 border-b pb-5">
                <div className="bg-[#e6f2f2] p-3 rounded-2xl text-[#005E60] shadow-inner">
                  <UserCheck className="w-8 h-8 text-[#005E60]" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-green-600 font-extrabold uppercase tracking-widest block">Login Berhasil</span>
                  <h3 className="text-lg font-heading font-extrabold text-[#005E60] leading-tight">
                    {selectedBranch.nama_kantor}
                  </h3>
                </div>
              </div>

              {/* Welcome Info */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 text-left">
                <p className="text-xs text-gray-500 font-medium">Petugas Aktif:</p>
                <p className="text-sm font-bold text-[#364146] mt-0.5">{loggedInUser?.name}</p>
                <p className="text-[10px] text-[#0099D3] font-bold uppercase tracking-wider mt-1">{loggedInUser?.role} • Cabang {loggedInUser?.id_kantor}</p>
              </div>

              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-4 text-left">Pilih Menu Akses Layanan:</p>

              {/* Action buttons list */}
              <div className="flex flex-col gap-4">
                
                {/* Option 1: Display Layar Utama */}
                <Link 
                  href={`/display?id_kantor=${selectedBranch.id_kantor}`}
                  className="group flex items-center justify-between bg-slate-50 hover:bg-gradient-to-r hover:from-[#005E60] hover:to-[#008285] hover:text-white rounded-2xl p-5 border border-slate-200/60 shadow-sm active:scale-[0.99] transition-all duration-300"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-white text-[#005E60] group-hover:bg-white/20 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm">
                      <Tv className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-[#364146] group-hover:text-white block leading-none transition-colors">
                        Layar Display Utama (TV)
                      </span>
                      <span className="text-[10px] text-gray-400 group-hover:text-cyan-100 mt-1.5 block">
                        Tampilkan nomor antrean & video promosi cabang
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </Link>

                {/* Option 2: Kiosk Cetak Antrean */}
                <Link 
                  href={`/kiosk?id_kantor=${selectedBranch.id_kantor}`}
                  className="group flex items-center justify-between bg-[#ffffd0]/60 hover:bg-gradient-to-r hover:from-[#ffff00] hover:to-[#ffd700] hover:text-[#364146] rounded-2xl p-5 border border-[#ffffa0]/50 shadow-sm active:scale-[0.99] transition-all duration-300"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-white text-[#999900] group-hover:bg-white/40 group-hover:text-[#364146] rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm">
                      <MonitorPlay className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-[#364146] block leading-none">
                        Mesin Cetak Antrean (Kiosk)
                      </span>
                      <span className="text-[10px] text-gray-500 group-hover:text-gray-700 mt-1.5 block">
                        Digunakan oleh nasabah untuk mengambil tiket antrean
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#364146] transition-colors" />
                </Link>

                {/* Option 3: Panel Petugas */}
                <Link 
                  href={`/counter?id_kantor=${selectedBranch.id_kantor}`}
                  className="group flex items-center justify-between bg-slate-50 hover:bg-gradient-to-r hover:from-[#005E60] hover:to-[#008285] hover:text-white rounded-2xl p-5 border border-slate-200/60 shadow-sm active:scale-[0.99] transition-all duration-300"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-white text-[#005E60] group-hover:bg-white/20 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-[#364146] group-hover:text-white block leading-none transition-colors">
                        Panel Panggilan (Petugas Loket)
                      </span>
                      <span className="text-[10px] text-gray-400 group-hover:text-cyan-100 mt-1.5 block">
                        Untuk memanggil, melayani, dan me-reset antrean
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </Link>

              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL BANTUAN */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white/95 backdrop-blur-md rounded-[28px] w-full max-w-sm p-8 shadow-2xl border border-white flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              type="button"
              onClick={() => setShowHelp(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-gray-700 transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-heading font-extrabold text-[#005E60] mb-4">Informasi Portal</h3>
            <div className="text-gray-500 text-sm space-y-4 text-left leading-relaxed font-light">
              <p>
                Aplikasi ini merupakan **Sistem Informasi Antrean Terpadu** untuk seluruh jaringan PT BPR Kerta Raharja (Perseroda).
              </p>
              <div>
                <strong>Cara Penggunaan:</strong>
                <ol className="list-decimal pl-5 mt-2 space-y-2 font-normal text-gray-600">
                  <li>Pilih lokasi kantor cabang Anda dari daftar grid di halaman utama.</li>
                  <li>Masukkan email dan kata sandi petugas cabang untuk membuka autentikasi.</li>
                  <li>Setelah login, pilih menu akses yang Anda butuhkan (Kiosk, Display TV, atau Panel Petugas).</li>
                  <li>Sistem antrean berjalan secara terpisah per cabang secara real-time.</li>
                </ol>
              </div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                IT Support Kantor Pusat BPR KR
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
