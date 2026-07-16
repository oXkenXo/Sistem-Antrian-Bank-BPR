"use client";
import { 
  useState, useEffect, useRef
} from "react";
import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { 
  Users, 
  Layers, 
  Settings, 
  PhoneCall, 
  Check, 
  SkipForward, 
  RefreshCw, 
  Trash2,
  Edit2,
  Plus,
  X,
  LogOut,
  Sparkles,
  Info,
  Image as ImageIcon,
  PlaySquare,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Wifi,
  Clock,
  CreditCard,
  Briefcase,
  Headphones
} from "lucide-react";
import { 
  branchApi, 
  queueApi, 
  counterApi, 
  informasiApi,
  authApi,
  QueueItem, 
  CounterItem,
  InformasiPublikItem
} from "@/lib/api";

interface AnnouncementItem {
  id: number;
  content: string;
  is_active: boolean;
  id_kantor?: string;
}

export default function CounterPage() {
  // Navigation tabs: 'antrean' | 'loket' | 'informasi' | 'info-publik'
  const [activeTab, setActiveTab] = useState<'antrean' | 'loket' | 'informasi' | 'info-publik'>('antrean');

  const [idKantor, setIdKantor] = useState<string>("01");
  const [namaKantor, setNamaKantor] = useState<string>("");

  // Login & Config state (Login loket)
  const [isConfigured, setIsConfigured] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [counterName, setCounterName] = useState("Teller 1");
  const [serviceType, setServiceType] = useState<string>("Teller");
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isAdmin = loggedInUser?.role === "admin";

  // Ambil id_kantor dari query string URL saat halaman dimuat
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id_kantor") || "01";
      setIdKantor(id);

      const fetchBranchName = async () => {
        try {
          const data = await branchApi.list();
          setAllBranches(data);
          const current = data.find((b: any) => b.id_kantor === id);
          if (current) setNamaKantor(current.nama_kantor);
        } catch (e) {
          console.warn("Gagal memuat nama cabang di Counter", e);
        }
      };
      fetchBranchName();
    }
  }, []);
  
  // Queue dashboard states
  const [activeTicket, setActiveTicket] = useState<QueueItem | null>(null);
  const [waitingList, setWaitingList] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState({
    total_waiting: 0,
    teller_waiting: 0,
    kredit_waiting: 0,
    cs_waiting: 0,
  });

  // CRUD states
  const [counters, setCounters] = useState<CounterItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  // Modals state
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [editingCounter, setEditingCounter] = useState<CounterItem | null>(null);
  const [counterForm, setCounterForm] = useState({ name: "", type: "Teller", is_active: true, id_kantor: "" });

  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [editingAnnounce, setEditingAnnounce] = useState<any | null>(null);
  const [announceForm, setAnnounceForm] = useState({ content: "", is_active: true, id_kantor: "" });
  const [allBranches, setAllBranches] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const [infoPublikList, setInfoPublikList] = useState<InformasiPublikItem[]>([]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [editingInfo, setEditingInfo] = useState<InformasiPublikItem | null>(null);
  const [infoForm, setInfoForm] = useState({
    judul: '',
    tipe: 'gambar' as 'gambar' | 'youtube' | 'teks_bergulir',
    konten: '',
    tanggal_berlaku: '',
    tanggal_kadaluarsa: '',
    is_active: true,
    urutan: 0,
    id_kantor: '',
  });

  // Delete Confirm Popups
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'loket' | 'informasi' | 'info-publik'; id: number } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lastDataRef = useRef<string>("");

  // Fetch all queues, stats, counters, and announcements
  const fetchStatus = async () => {
    if (!idKantor) return;
    try {
      const data = await queueApi.status(idKantor);
      
      const currentDataStr = JSON.stringify({ waiting: data.waiting, stats: data.stats, calling: data.calling });
      if (lastDataRef.current === currentDataStr) return;
      lastDataRef.current = currentDataStr;

      setWaitingList(data.waiting || []);
      setStats(data.stats || {
        total_waiting: 0,
        teller_waiting: 0,
        kredit_waiting: 0,
        cs_waiting: 0,
      });

      if (data.calling && data.calling.length > 0) {
        const myActive = data.calling.find((q: QueueItem) => q.counter_name === counterName);
        setActiveTicket(myActive || null);
      } else {
        setActiveTicket(null);
      }
    } catch (error) {
      // silently ignore network errors
    }
  };

  // Fetch Counters List for CRUD
  const fetchCounters = async () => {
    try {
      const data = await counterApi.list(idKantor);
      setCounters(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Announcements List
  const fetchAnnouncements = async () => {
    try {
      const data = await informasiApi.list(
        (loggedInUser?.role === 'admin' && idKantor === '01') ? undefined : idKantor
      );
      const texts = data
        .filter((item) => item.tipe === 'teks_bergulir')
        .map((item) => ({
          id: item.id,
          content: item.konten,
          is_active: item.is_active,
          id_kantor: item.id_kantor ?? undefined,
        }));
      setAnnouncements(texts);
    } catch (e) { console.error(e); }
  };

  // Fetch InformasiPublik List
  const fetchInformasiPublik = async () => {
    try {
      const data = await informasiApi.list(
        (loggedInUser?.role === 'admin' && idKantor === '01') ? undefined : idKantor
      );
      const mediaList = data.filter((item) => item.tipe === 'gambar' || item.tipe === 'youtube');
      setInfoPublikList(mediaList);
    } catch (e) { console.error(e); }
  };

  // Save InformasiPublik
  const handleSaveInfoPublik = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const targetIdKantor = (loggedInUser?.role === 'admin' && idKantor === "01")
        ? (infoForm.id_kantor || null)
        : idKantor;

      if (editingInfo) {
        await informasiApi.update(editingInfo.id, {
          ...infoForm,
          id_kantor: targetIdKantor,
          tanggal_berlaku: infoForm.tanggal_berlaku || null,
          tanggal_kadaluarsa: infoForm.tanggal_kadaluarsa || null,
        });
      } else {
        await informasiApi.create({
          ...infoForm,
          id_kantor: targetIdKantor,
          tanggal_berlaku: infoForm.tanggal_berlaku || null,
          tanggal_kadaluarsa: infoForm.tanggal_kadaluarsa || null,
        });
      }
      setShowInfoModal(false);
      fetchInformasiPublik();
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  // Delete InformasiPublik
  const handleDeleteInfoPublik = async (id: number) => {
    const previousList = [...infoPublikList];
    setInfoPublikList(prev => prev.filter(i => i.id !== id));
    setDeleteConfirm(null);
    try {
      await informasiApi.delete(id);
      fetchInformasiPublik();
    } catch (e) { 
      console.error(e); 
      setInfoPublikList(previousList);
    }
  };

  // Toggle active status inline
  const handleToggleInfoActive = async (item: InformasiPublikItem) => {
    const previousList = [...infoPublikList];
    setInfoPublikList(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    try {
      await informasiApi.update(item.id, {
        judul: item.judul,
        tipe: item.tipe,
        konten: item.konten,
        tanggal_berlaku: item.tanggal_berlaku,
        tanggal_kadaluarsa: item.tanggal_kadaluarsa,
        is_active: !item.is_active,
        urutan: item.urutan,
        id_kantor: item.id_kantor
      });
      fetchInformasiPublik();
    } catch (e) { 
      console.error(e); 
      setInfoPublikList(previousList);
    }
  };

  // Call Next Ticket
  const handleCallNext = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const resData = await queueApi.callNext({
        id_kantor: idKantor,
        counter_name: counterName,
        service_type: serviceType,
      });
      setActiveTicket(resData.data);
      fetchStatus();
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Recall current ticket
  const handleRecall = async () => {
    if (!activeTicket) return;
    setIsLoading(true);
    try {
      await queueApi.recall(activeTicket.id);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Complete current ticket
  const handleComplete = async () => {
    if (!activeTicket) return;
    setIsLoading(true);
    try {
      await queueApi.complete(activeTicket.id);
      setActiveTicket(null);
      fetchStatus();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Skip current ticket
  const handleSkip = async () => {
    if (!activeTicket) return;
    setIsLoading(true);
    try {
      await queueApi.skip(activeTicket.id);
      setActiveTicket(null);
      fetchStatus();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset all queues
  const handleResetQueues = async () => {
    if (!confirm("Apakah Anda yakin ingin mereset seluruh antrean hari ini? Semua nomor antrean akan dihapus.")) return;
    setIsLoading(true);
    try {
      await queueApi.reset(idKantor);
      setActiveTicket(null);
      fetchStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD - Save Counter
  const handleSaveCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const targetIdKantor = isAdmin && counterForm.id_kantor 
      ? counterForm.id_kantor 
      : idKantor;

    try {
      if (editingCounter) {
        await counterApi.update(editingCounter.id, {
          ...counterForm,
          id_kantor: targetIdKantor,
        });
      } else {
        await counterApi.create({
          ...counterForm,
          id_kantor: targetIdKantor,
        });
      }
      setShowCounterModal(false);
      setEditingCounter(null);
      setCounterForm({ name: "", type: "Teller", is_active: true, id_kantor: "" });
      fetchCounters();
    } catch (e: any) {
      alert(e.message || "Gagal menyimpan loket.");
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD - Delete Counter
  const handleDeleteCounter = async (id: number) => {
    const previousCounters = [...counters];
    setCounters(prev => prev.filter(c => c.id !== id));
    setDeleteConfirm(null);
    try {
      await counterApi.delete(id);
      fetchCounters();
    } catch (e) {
      console.error(e);
      setCounters(previousCounters);
    }
  };

  // CRUD - Save Announcement
  const handleSaveAnnounce = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const targetIdKantor = (loggedInUser?.role === 'admin' && idKantor === "01")
      ? (announceForm.id_kantor || null)
      : idKantor;

    try {
      if (editingAnnounce) {
        await informasiApi.update(editingAnnounce.id, {
          id_kantor: targetIdKantor,
          judul: `Running Text ${editingAnnounce.id}`,
          tipe: 'teks_bergulir',
          konten: announceForm.content,
          is_active: announceForm.is_active,
          urutan: 0
        });
      } else {
        await informasiApi.create({
          id_kantor: targetIdKantor,
          judul: 'Running Text Baru',
          tipe: 'teks_bergulir',
          konten: announceForm.content,
          is_active: announceForm.is_active,
          urutan: 0,
          tanggal_berlaku: null,
          tanggal_kadaluarsa: null,
        });
      }
      setShowAnnounceModal(false);
      setEditingAnnounce(null);
      setAnnounceForm({ content: "", is_active: true, id_kantor: "" });
      fetchAnnouncements();
    } catch (e: any) {
      alert(e.message || "Gagal menyimpan pengumuman.");
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD - Delete Announcement
  const handleDeleteAnnounce = async (id: number) => {
    const previousAnnouncements = [...announcements];
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null);
    try {
      await informasiApi.delete(id);
      fetchAnnouncements();
    } catch (e) {
      console.error(e);
      setAnnouncements(previousAnnouncements);
    }
  };

  // Poll queues state when configured
  useEffect(() => {
    if (isConfigured) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isConfigured, counterName, serviceType, idKantor]);

  // Fetch data only when switching to CRUD tabs to prevent server choking
  useEffect(() => {
    if (isConfigured) {
      if (activeTab === 'loket') fetchCounters();
      else if (activeTab === 'informasi') fetchAnnouncements();
      else if (activeTab === 'info-publik') fetchInformasiPublik();
    }
  }, [activeTab, isConfigured, idKantor]);

  // Set default counter values when loaded
  useEffect(() => {
    if (counters.length > 0) {
      setCounterName(counters[0].name);
      setServiceType(counters[0].type);
    }
  }, [counters]);

  // Load configuration lists on mount
  useEffect(() => {
    if (idKantor) {
      fetchCounters();
    }
  }, [idKantor]);

  // SSO Session check dari landing page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`user_${idKantor}`);
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u.role === 'admin' || String(u.id_kantor) === String(idKantor)) {
            setLoggedInUser(u);
            const storedConfigSession = sessionStorage.getItem(`config_${idKantor}`);
            const storedConfig = storedConfigSession || localStorage.getItem(`config_${idKantor}`);
            if (storedConfig) {
              if (!storedConfigSession) {
                sessionStorage.setItem(`config_${idKantor}`, storedConfig);
              }
              const c = JSON.parse(storedConfig);
              setCounterName(c.counterName);
              setServiceType(c.serviceType);
              setIsConfigured(true);
            }
          }
        } catch (e) {
          console.error("Gagal membaca session user", e);
        }
      }
    }
  }, [idKantor]);

  // Handler Login & Masuk Loket
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Jika sudah terautentikasi lewat SSO di landing page, tinggal setuju loket & langsung masuk
    if (loggedInUser) {
      if (typeof window !== "undefined") {
        const configStr = JSON.stringify({ counterName, serviceType });
        localStorage.setItem(`config_${idKantor}`, configStr);
        sessionStorage.setItem(`config_${idKantor}`, configStr);
      }
      setIsConfigured(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const resData = await authApi.login({
        email: email,
        password: password,
        id_kantor: idKantor,
      });
      setLoggedInUser(resData.user);
      if (typeof window !== "undefined") {
        localStorage.setItem(`user_${idKantor}`, JSON.stringify(resData.user));
        const configStr = JSON.stringify({ counterName, serviceType });
        localStorage.setItem(`config_${idKantor}`, configStr);
        sessionStorage.setItem(`config_${idKantor}`, configStr);
      }
      setIsConfigured(true);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Login/Config Screen (Wireframe: page petugas)
  if (!mounted) {
    return null; // Prevents hydration mismatch without flashing a heavy spinner
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00383a] via-[#005E60] to-[#002f31] p-6 relative">
        
        {/* Tombol Kembali ke Pemilihan Menu Layanan */}
        <Link
          href={`/?services=open&id_kantor=${idKantor}`}
          className="absolute top-6 left-6 z-20 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 rounded-2xl px-4 py-2.5 flex items-center gap-2 transition-all duration-200 font-bold text-xs group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Kembali ke Menu Layanan
        </Link>

        <form 
          onSubmit={handleLoginSubmit}
          className="bg-white rounded-[32px] w-full max-w-md p-8 md:p-10 shadow-2xl border border-gray-100 flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        >
          
          {/* Top Logo Banner */}
          <div className="flex items-center gap-3 justify-center mb-6 border-b pb-5">
            <BrandLogo />
            <span className="font-heading font-extrabold text-xl text-[#005E60] border-l pl-3 border-gray-200">
              Loket Petugas
            </span>
          </div>

          <h2 className="text-xl font-bold text-[#364146] mb-1 font-heading flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#005E60]" />
            Masuk Panel Loket
          </h2>
          <p className="text-gray-500 text-xs mb-5 leading-relaxed">
            {loggedInUser ? (
              <span>Anda telah terautentikasi. Silakan pilih nomor loket & jenis kategori pelayanan Anda hari ini.</span>
            ) : (
              <span>Silakan login untuk mengakses panel loket di <strong className="text-[#005E60]">{namaKantor || `Cabang ${idKantor}`}</strong>.</span>
            )}
          </p>

          {/* User Info Badge if Logged In via SSO */}
          {loggedInUser && (
            <div className="bg-[#e6f2f2] border border-[#b2e1e3] rounded-2xl p-4 mb-4 text-left flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Petugas Aktif</p>
                <p className="text-sm font-extrabold text-[#005E60]">{loggedInUser.name}</p>
                <p className="text-[10px] text-[#0099D3] font-semibold uppercase mt-0.5">{loggedInUser.role} • Cabang {loggedInUser.id_kantor}</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setLoggedInUser(null);
                  localStorage.removeItem(`user_${idKantor}`);
                  localStorage.removeItem(`config_${idKantor}`);
                  sessionStorage.removeItem(`config_${idKantor}`);
                }}
                className="text-xs font-bold text-red-500 hover:text-red-700 underline cursor-pointer"
              >
                Keluar
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold p-4 rounded-xl border border-red-200 mb-4 text-left leading-relaxed">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-4">
            
            {/* Tampilkan kolom email/password HANYA jika petugas belum login */}
            {!loggedInUser && (
              <>
                {/* Email Field */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Petugas</label>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="petugas@bpr.co.id"
                    className="border border-gray-200 bg-slate-50 text-gray-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005E60] focus:bg-white transition-all shadow-sm"
                  />
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-1.5 text-left">
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
              </>
            )}

            {/* Counter Selection */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pilih Nomor Loket</label>
              <select 
                value={counterName}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  setCounterName(selectedName);
                  // Otomatis set kategori pelayanan berdasarkan tipe loket yang dipilih
                  const selected = counters.find(c => c.name === selectedName);
                  if (selected) {
                    setServiceType(selected.type);
                  }
                }}
                className="border border-gray-200 bg-slate-50 text-gray-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005E60] focus:bg-white transition-all shadow-sm"
              >
                <optgroup label="Daftar Loket Cabang">
                  {counters.length > 0 ? (
                    counters.map((c) => (
                      <option key={c.id} value={c.name}>{c.name} — {c.type}</option>
                    ))
                  ) : (
                    <>
                      {[
                        { name: 'Teller 1', type: 'Teller' },
                        { name: 'Teller 2', type: 'Teller' },
                        { name: 'Customer Service 1', type: 'Customer Service' },
                      ].map(fb => (
                        <option key={fb.name} value={fb.name}>{fb.name} — {fb.type}</option>
                      ))}
                    </>
                  )}
                </optgroup>
              </select>
            </div>


            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full bg-gradient-to-r from-[#005E60] to-[#008285] hover:from-[#004a4c] hover:to-[#005E60] text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all text-lg border-b-4 border-[#00383a] disabled:opacity-50"
            >
              {isLoading ? "Memproses..." : "Masuk Panel Loket"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Filter waiting list specific to this counter's service type
  const serviceWaitingList = waitingList.filter(item => item.service_type === serviceType);

  return (
    <div className="bg-[#f8f9fa] text-[#364146] min-h-screen flex flex-col font-sans relative overflow-x-hidden select-none">
      
      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-md border-b border-gray-150 h-20 flex-shrink-0 flex items-center z-10">
        <div className="max-w-[1440px] mx-auto w-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              alt="BPR Kerta Raharja Logo" 
              className="h-8 w-auto object-contain bg-white rounded p-0.5" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy_PuUGIg6TcQonvnrv6ChV2tYXRE9vUggKMMgCxgxhRuXOAR7d9HS89fGozDfGiPO7VB1_XILA462zY4-y7rIBw5IZMOMqDS39L2JBtPe3M4wqKYvHrhQ2yz9GDx4h91Ej7rQhMZePA5RMX8EKLGhANiiYcCX4oUDdB8SkCXb1XitQqo69ZO5G5lkJVH12RUQfg4srNQeClopYv2Ike-yRyP-U3N1S4HA842PFSAuFRWGmig0lFIIfXDs2kOdoj01zxU"
            />
            <div className="border-l pl-4 border-gray-200">
              <h1 className="font-heading font-extrabold text-lg text-[#005E60] leading-none">
                PANEL PETUGAS LOKET
              </h1>
              <span className="text-[10px] text-[#0099D3] font-bold uppercase tracking-wider mt-1 block">
                {namaKantor || `Cabang Kode: ${idKantor}`}
              </span>
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1 block">
                {counterName} • Kategori: {serviceType} • Petugas: {loggedInUser?.name || "Petugas"}
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Wireframe: page petugas 2 - kelola informasi, kelola loket) */}
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-gray-200 flex-wrap">
            <button 
              onClick={() => setActiveTab('antrean')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'antrean' 
                  ? 'bg-[#005E60] text-white shadow-md' 
                  : 'text-gray-500 hover:bg-slate-200'
              }`}
            >
              Panggilan Antrean
            </button>
            {/* Semua petugas (dan admin) bisa akses Kelola Loket */}
            <button 
              onClick={() => setActiveTab('loket')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'loket' 
                  ? 'bg-[#005E60] text-white shadow-md' 
                  : 'text-gray-500 hover:bg-slate-200'
              }`}
            >
              Kelola Loket
            </button>

            {/* Hanya admin yang bisa kelola pengumuman & informasi publik */}
            {isAdmin && (
              <>
                <button 
                  onClick={() => setActiveTab('informasi')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'informasi' 
                      ? 'bg-[#005E60] text-white shadow-md' 
                      : 'text-gray-500 hover:bg-slate-200'
                  }`}
                >
                  Kelola Teks Pengumuman
                </button>
                <button 
                  onClick={() => setActiveTab('info-publik')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'info-publik' 
                      ? 'bg-[#00638a] text-white shadow-md' 
                      : 'text-[#00638a] hover:bg-blue-50 border border-[#00638a]/30'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  Informasi Publik Display
                </button>
              </>
            )}
          </div>

          <button 
            onClick={() => {
              setLoggedInUser(null);
              localStorage.removeItem(`user_${idKantor}`);
              localStorage.removeItem(`config_${idKantor}`);
              sessionStorage.removeItem(`config_${idKantor}`);
              setIsConfigured(false);
              setActiveTab('antrean'); // Reset tab to default for safety
            }}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl border border-red-200 font-bold transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-[1440px] mx-auto w-full p-6 md:p-8 flex flex-col gap-6">

        {/* TAB 1: Antrean Loket Calling Screen */}
        {activeTab === 'antrean' && (
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Calling Desk Console */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6">
              
              {/* Main Calling Card */}
              <div className="bg-white rounded-[28px] border border-gray-200 shadow-xl flex flex-col min-h-[400px] relative overflow-hidden">
                {/* Premium top accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#005E60] via-[#008285] to-[#00a3a6]"></div>
                
                {/* Console Header */}
                <div className="px-8 pt-6 pb-4 flex justify-between items-center border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${activeTicket ? 'bg-emerald-500 animate-ping' : 'bg-gray-300'} shadow-sm`}></div>
                    <div>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block leading-none">
                        Status Loket
                      </span>
                      <span className={`text-sm font-extrabold ${activeTicket ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {activeTicket ? 'Sedang Melayani' : 'Siap Menunggu'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[#e6f2f2] flex items-center justify-center">
                      <Wifi className={`w-4 h-4 ${counterName ? 'text-green-600' : 'text-gray-300'}`} />
                    </div>
                    <span className="text-[11px] font-bold text-[#005E60] bg-[#e6f2f2] px-3 py-1.5 rounded-lg border border-[#b2e1e3]">
                      {counterName}
                    </span>
                    <span className="text-[11px] font-bold text-white bg-[#005E60] px-3 py-1.5 rounded-lg">
                      {serviceType}
                    </span>
                  </div>
                </div>

                {/* Big Calling Number */}
                <div className="flex-grow flex flex-col justify-center items-center py-8 text-center relative overflow-hidden">
                  {/* Background decorative circle */}
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#005E60]/[0.03] rounded-full pointer-events-none"></div>
                  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#008285]/[0.03] rounded-full pointer-events-none"></div>

                  {activeTicket ? (
                    <div className="animate-in zoom-in-95 duration-300 relative z-10">
                      <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full mb-4">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                        <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest">Sedang Dipanggil</span>
                      </div>
                      <div className="text-8xl md:text-9xl font-mono font-black text-[#005E60] tracking-tight drop-shadow-sm mb-3 leading-none">
                        {activeTicket.ticket_number}
                      </div>
                      <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Mulai: {new Date(activeTicket.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10">
                      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-5 border-2 border-dashed border-gray-200">
                        <Users className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-5xl font-mono font-black text-gray-200 mb-2">---</p>
                      <p className="text-sm font-bold text-gray-400 mb-1">Tidak Ada Antrean Aktif</p>
                      <p className="text-xs text-gray-400 max-w-[240px] mx-auto leading-relaxed">
                        Klik <strong>"Panggil Berikutnya"</strong> untuk memanggil antrean pertama
                      </p>
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="mx-8 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl px-4 py-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {errorMessage}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="px-8 pb-6 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-5 gap-2.5">
                    {/* Call Next */}
                    <button 
                      onClick={handleCallNext}
                      disabled={isLoading}
                      className="bg-gradient-to-br from-[#005E60] to-[#008285] hover:from-[#004a4c] hover:to-[#005E60] text-white rounded-2xl py-4 font-bold flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-[#005E60]/20 active:scale-[0.97] transition-all disabled:opacity-50"
                    >
                      <PhoneCall className="w-5 h-5" />
                      <span className="text-[10px]">Panggil</span>
                      <span className="text-[9px] opacity-70">Berikutnya</span>
                    </button>

                    {/* Recall */}
                    <button 
                      onClick={handleRecall}
                      disabled={isLoading || !activeTicket}
                      className="bg-white hover:bg-slate-50 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-2xl py-4 font-bold flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-[0.97] transition-all disabled:opacity-30"
                    >
                      <RefreshCw className="w-5 h-5 text-gray-500" />
                      <span className="text-[10px]">Panggil</span>
                      <span className="text-[9px] opacity-70">Ulang</span>
                    </button>

                    {/* Skip */}
                    <button 
                      onClick={handleSkip}
                      disabled={isLoading || !activeTicket}
                      className="bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-300 text-amber-700 rounded-2xl py-4 font-bold flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-[0.97] transition-all disabled:opacity-30"
                    >
                      <SkipForward className="w-5 h-5" />
                      <span className="text-[10px]">Skip</span>
                      <span className="text-[9px] opacity-70">Nomor</span>
                    </button>

                    {/* Complete */}
                    <button 
                      onClick={handleComplete}
                      disabled={isLoading || !activeTicket}
                      className="bg-gradient-to-br from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-2xl py-4 font-bold flex flex-col items-center justify-center gap-1.5 shadow-lg active:scale-[0.97] transition-all disabled:opacity-50"
                    >
                      <Check className="w-5 h-5" />
                      <span className="text-[10px]">Selesai</span>
                      <span className="text-[9px] opacity-70">Layanan</span>
                    </button>

                    {/* Reset */}
                    <button 
                      onClick={handleResetQueues}
                      disabled={isLoading}
                      className="bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 text-red-600 rounded-2xl py-4 font-bold flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-[0.97] transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="text-[10px]">Reset</span>
                      <span className="text-[9px] opacity-70">Antrean</span>
                    </button>
                  </div>
                </div>

                {/* Enhanced Premium Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 px-8 pb-6">
                  {[
                    { 
                      label: 'Total Menunggu', 
                      value: stats.total_waiting, 
                      icon: <Users className="w-5 h-5 text-[#005E60]" />,
                      bgIcon: 'bg-[#005E60]/10',
                      borderColor: 'border-[#005E60]/20',
                      accent: 'bg-[#005E60]'
                    },
                    { 
                      label: 'Antrean Teller (A)', 
                      value: stats.teller_waiting, 
                      icon: <CreditCard className="w-5 h-5 text-blue-600" />,
                      bgIcon: 'bg-blue-50',
                      borderColor: 'border-blue-100',
                      accent: 'bg-blue-500'
                    },
                    { 
                      label: 'Antrean Kredit (B)', 
                      value: stats.kredit_waiting, 
                      icon: <Briefcase className="w-5 h-5 text-amber-600" />,
                      bgIcon: 'bg-amber-50',
                      borderColor: 'border-amber-100',
                      accent: 'bg-amber-500'
                    },
                    { 
                      label: 'Antrean CS (C)', 
                      value: stats.cs_waiting, 
                      icon: <Headphones className="w-5 h-5 text-purple-600" />,
                      bgIcon: 'bg-purple-50',
                      borderColor: 'border-purple-100',
                      accent: 'bg-purple-500'
                    },
                  ].map((stat, idx) => (
                    <div 
                      key={stat.label} 
                      className={`relative bg-white rounded-2xl p-5 shadow-sm border ${stat.borderColor} overflow-hidden group hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
                    >
                      {/* Accent Line */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${stat.accent}`}></div>
                      
                      {/* Background Glow */}
                      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${stat.bgIcon} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`}></div>

                      <div className="flex justify-between items-start relative z-10">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">{stat.label}</span>
                          <span className="text-4xl font-black text-gray-800 font-mono tracking-tighter">
                            {stat.value}
                          </span>
                        </div>
                        <div className={`w-10 h-10 rounded-xl ${stat.bgIcon} flex items-center justify-center shadow-inner`}>
                          {stat.icon}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Waiting List Sidebar */}
            <div className="w-full lg:w-1/3 flex flex-col">
              <div className="bg-white rounded-[28px] border border-gray-100 shadow-2xl flex-grow flex flex-col overflow-hidden min-h-[400px]">
                
                {/* Sidebar Premium Header */}
                <div className="bg-gradient-to-br from-[#005E60] to-[#008285] px-6 py-5 flex items-center justify-between rounded-t-[28px]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Layers className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] text-white/50 font-bold uppercase tracking-[0.15em] leading-none">Antrean</p>
                      <h4 className="font-heading font-extrabold text-white text-sm leading-tight mt-0.5">
                        {serviceType}
                      </h4>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2 min-w-[56px] text-center">
                    <span className="text-2xl font-mono font-black text-white leading-none">{serviceWaitingList.length}</span>
                    <span className="text-[8px] text-white/60 font-bold uppercase tracking-wider">Tiket</span>
                  </div>
                </div>

                {/* Ticket List */}
                <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2 max-h-[55vh]
                  [&::-webkit-scrollbar]:w-1.5
                  [&::-webkit-scrollbar-track]:bg-gray-50
                  [&::-webkit-scrollbar-thumb]:bg-gray-200
                  [&::-webkit-scrollbar-thumb]:rounded-full">
                  {serviceWaitingList.length > 0 ? (
                    serviceWaitingList.map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between rounded-2xl p-3.5 transition-all duration-200 hover:shadow-md ${
                          index === 0
                            ? "bg-gradient-to-r from-[#005E60]/8 to-[#008285]/5 border-2 border-[#005E60]/20 shadow-sm"
                            : index === 1
                            ? "bg-sky-50/70 border border-sky-200/60"
                            : "bg-slate-50/70 border border-gray-100"
                        }`}
                      >
                        {/* Position + Ticket */}
                        <div className="flex items-center gap-3">
                          {/* Position Badge */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm flex-shrink-0 shadow-sm ${
                            index === 0
                              ? "bg-gradient-to-br from-[#005E60] to-[#008285] text-white shadow-[#005E60]/30"
                              : index === 1
                              ? "bg-sky-500 text-white"
                              : "bg-white border-2 border-gray-200 text-gray-400"
                          }`}>
                            {index + 1}
                          </div>
                          {/* Ticket Info */}
                          <div>
                            <div className={`font-mono font-extrabold text-base leading-none ${
                              index === 0 ? "text-[#005E60]" : "text-[#364146]"
                            }`}>
                              {item.ticket_number}
                            </div>
                            <span className="text-[9px] text-gray-400 font-semibold mt-0.5 block">
                              {new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                            </span>
                          </div>
                        </div>

                        {/* Badge */}
                        {index === 0 && (
                          <span className="text-[9px] bg-gradient-to-r from-[#005E60] to-[#008285] text-white font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
                            <Sparkles className="w-2.5 h-2.5" />
                            Sekarang
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center py-16 text-gray-400">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                        <Layers className="w-7 h-7 text-gray-300" />
                      </div>
                      <span className="text-sm font-bold text-gray-400 block mb-1">Antrean Kosong</span>
                      <p className="text-[11px] text-gray-400 max-w-[180px] leading-relaxed">
                        Belum ada tiket untuk {serviceType}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Kelola Loket */}
        {activeTab === 'loket' && (
          <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl flex flex-col min-h-[450px] overflow-hidden">
            
            {/* Premium Header dengan background gradient */}
            <div className="bg-gradient-to-r from-[#005E60] to-[#008285] px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-heading">
                      Kelola Daftar Loket
                    </h2>
                    <p className="text-xs text-white/70 mt-0.5">
                      {isAdmin 
                        ? 'Kelola loket untuk semua cabang — Tambah, edit, aktif/nonaktifkan'
                        : `${namaKantor || `Cabang ${idKantor}`} — Atur loket cabang Anda`
                      }
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setEditingCounter(null);
                    setCounterForm({ name: "", type: "Teller", is_active: true, id_kantor: isAdmin ? (allBranches[0]?.id_kantor || idKantor) : idKantor });
                    setShowCounterModal(true);
                  }}
                  className="bg-white hover:bg-slate-50 text-[#005E60] rounded-xl px-5 py-3 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-[0.98] whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Loket Baru
                </button>
              </div>
            </div>

            {/* Stats bar — jumlah loket aktif/total */}
            <div className="flex items-center gap-4 px-8 py-3 bg-slate-50 border-b border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-700">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {counters.filter(c => c.is_active).length} Aktif
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                {counters.filter(c => !c.is_active).length} Nonaktif
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#005E60]">
                <ShieldCheck className="w-3 h-3" />
                Total {counters.length} Loket
              </div>
            </div>

            {/* List Grid */}
            <div className="p-8">
              {counters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {counters.map((c) => (
                    <div 
                      key={c.id}
                      className={`rounded-2xl border-2 p-5 flex flex-col justify-between min-h-[170px] relative transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group ${
                        c.is_active 
                          ? 'bg-white border-emerald-200 hover:border-emerald-300' 
                          : 'bg-slate-50/70 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Status indicator dot */}
                      <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${
                        c.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-gray-300'
                      }`} />
                      
                      {/* Type badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          c.type === 'Teller' 
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : c.type === 'Kredit'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-purple-50 text-purple-600 border border-purple-200'
                        }`}>
                          {c.type}
                        </span>
                      </div>

                      {/* Counter name */}
                      <div className="flex-grow flex items-center">
                        <h4 className={`font-heading font-extrabold text-xl leading-tight ${
                          c.is_active ? 'text-[#364146]' : 'text-gray-400'
                        }`}>
                          {c.name}
                        </h4>
                      </div>

                      {/* Bottom actions */}
                      <div className="flex items-center justify-between border-t pt-4 mt-2">
                        {/* Toggle status */}
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          c.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {c.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>

                        {/* Action buttons */}
                        <div className="flex gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingCounter(c);
                              setCounterForm({ name: c.name, type: c.type, is_active: c.is_active, id_kantor: c.id_kantor || idKantor });
                              setShowCounterModal(true);
                            }}
                            className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl border border-gray-200 hover:border-blue-200 transition-all"
                            title="Edit loket"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirm({ type: 'loket', id: c.id })}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-xl border border-gray-200 hover:border-red-200 transition-all"
                            title="Hapus loket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-5 border-2 border-dashed border-gray-200">
                    <Settings className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-bold text-gray-400">Belum ada loket terdaftar</p>
                  <p className="text-xs mt-1.5 text-gray-400">Klik "Tambah Loket Baru" untuk mulai menambahkan loket</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Kelola Teks Pengumuman (Running Text) */}
        {activeTab === 'informasi' && (
          <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl flex flex-col min-h-[450px] overflow-hidden">
            
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-[#005E60] to-[#008285] px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-heading">
                      Kelola Teks Pengumuman
                    </h2>
                    <p className="text-xs text-white/70 mt-0.5">
                      Atur teks berjalan yang tampil di bagian bawah monitor utama cabang
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setEditingAnnounce(null);
                    setAnnounceForm({ content: "", is_active: true, id_kantor: "" });
                    setShowAnnounceModal(true);
                  }}
                  className="bg-white hover:bg-slate-50 text-[#005E60] rounded-xl px-5 py-3 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-[0.98] whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Teks Baru
                </button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 px-8 py-3 bg-slate-50 border-b border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-700">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {announcements.filter(a => a.is_active).length} Aktif
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                {announcements.filter(a => !a.is_active).length} Nonaktif
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#005E60]">
                <Info className="w-3 h-3" />
                Total {announcements.length} Teks
              </div>
            </div>

            {/* List Grid */}
            <div className="p-8">
              {announcements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {announcements.map((a) => (
                    <div 
                      key={a.id}
                      className={`rounded-2xl border-2 p-5 flex flex-col justify-between min-h-[160px] relative transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group ${
                        a.is_active 
                          ? 'bg-white border-emerald-200 hover:border-emerald-300' 
                          : 'bg-slate-50/70 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Status dot */}
                      <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${
                        a.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-gray-300'
                      }`} />
                      
                      {/* Branch badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-sky-50 text-sky-600 border border-sky-200">
                          {a.id_kantor ? `Cabang ${a.id_kantor}` : 'Global (Pusat)'}
                        </span>
                      </div>

                      {/* Content preview */}
                      <div className="flex-grow flex items-start">
                        <p className="text-sm font-semibold text-[#364146] leading-relaxed line-clamp-3">
                          {a.content}
                        </p>
                      </div>

                      {/* Bottom actions */}
                      <div className="flex items-center justify-between border-t pt-4 mt-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          a.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {a.is_active ? 'Tampil di TV' : 'Disembunyikan'}
                        </span>

                        <div className="flex gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingAnnounce(a);
                              setAnnounceForm({ content: a.content, is_active: a.is_active, id_kantor: a.id_kantor || "" });
                              setShowAnnounceModal(true);
                            }}
                            className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl border border-gray-200 hover:border-blue-200 transition-all"
                            title="Edit teks"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirm({ type: 'informasi', id: a.id })}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-xl border border-gray-200 hover:border-red-200 transition-all"
                            title="Hapus teks"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-5 border-2 border-dashed border-gray-200">
                    <Info className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-bold text-gray-400">Belum ada teks pengumuman</p>
                  <p className="text-xs mt-1.5 text-gray-400">Klik "Tambah Teks Baru" untuk menambahkan pengumuman berjalan</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Informasi Publik (Gambar & YouTube untuk Monitor Display) */}
        {activeTab === 'info-publik' && (
          <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl flex flex-col min-h-[450px] overflow-hidden">
            
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-[#00638a] to-[#0085b2] px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-heading">
                      Informasi Publik — Galeri Display
                    </h2>
                    <p className="text-xs text-white/70 mt-0.5">
                      Kelola gambar & video YouTube untuk panel kanan monitor TV cabang
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setEditingInfo(null);
                    setInfoForm({ judul: '', tipe: 'gambar', konten: '', tanggal_berlaku: '', tanggal_kadaluarsa: '', is_active: true, urutan: 0, id_kantor: '' });
                    setShowInfoModal(true);
                  }}
                  className="bg-white hover:bg-slate-50 text-[#00638a] rounded-xl px-5 py-3 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-[0.98] whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Konten
                </button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 px-8 py-3 bg-slate-50 border-b border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-700">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {infoPublikList.filter(i => i.is_active).length} Aktif
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                {infoPublikList.filter(i => !i.is_active).length} Nonaktif
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#00638a]">
                <ImageIcon className="w-3 h-3" />
                {infoPublikList.filter(i => i.tipe === 'gambar').length} Gambar • {infoPublikList.filter(i => i.tipe === 'youtube').length} Video
              </div>
            </div>

            {/* Konten Grid */}
            <div className="p-8">
              {infoPublikList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-5 border-2 border-dashed border-gray-200">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-bold text-gray-400">Belum ada konten informasi publik</p>
                  <p className="text-xs mt-1.5 text-gray-400">Klik "Tambah Konten" untuk menambahkan gambar atau video</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {infoPublikList.map((item) => {
                    const isYoutube = item.tipe === 'youtube';
                    const ytId = isYoutube ? item.konten.match(/(?:youtu\.be\/|embed\/|watch\?v=|&v=)([^#&?]{11})/)?.[1] : null;
                    const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : item.konten;

                    return (
                      <div key={item.id} className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group ${
                        item.is_active ? 'border-[#00638a]/30' : 'border-gray-200 opacity-70'
                      }`}>
                        {/* Thumbnail */}
                        <div className="relative h-44 bg-gray-900 overflow-hidden">
                          <img
                            src={isYoutube ? thumbUrl! : item.konten}
                            alt={item.judul}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x240?text=Preview'; }}
                          />
                          {isYoutube && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="bg-red-600 rounded-full p-3 shadow-lg">
                                <PlaySquare className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          )}
                          <div className={`absolute top-3 left-3 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase shadow-sm ${
                            isYoutube ? 'bg-red-600 text-white' : 'bg-[#00638a] text-white'
                          }`}>
                            {item.tipe} {item.id_kantor ? `(${item.id_kantor})` : "(Global)"}
                          </div>
                          <div className={`absolute top-3 right-3 text-[9px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
                            item.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
                          }`}>
                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-4 bg-white">
                          <p className="font-bold text-sm text-[#364146] truncate">{item.judul}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {item.urutan > 0 && (
                              <span className="text-[10px] text-gray-400">#{item.urutan}</span>
                            )}
                            {item.tanggal_kadaluarsa && (
                              <span className="text-[10px] text-amber-600">Exp: {item.tanggal_kadaluarsa}</span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => handleToggleInfoActive(item)}
                              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                                item.is_active 
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' 
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {item.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {item.is_active ? 'Sembunyikan' : 'Tampilkan'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingInfo(item);
                                setInfoForm({
                                  judul: item.judul,
                                  tipe: item.tipe,
                                  konten: item.konten,
                                  tanggal_berlaku: item.tanggal_berlaku || '',
                                  tanggal_kadaluarsa: item.tanggal_kadaluarsa || '',
                                  is_active: item.is_active,
                                  urutan: item.urutan,
                                  id_kantor: item.id_kantor || '',
                                });
                                setShowInfoModal(true);
                              }}
                              className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl border border-gray-200 hover:border-blue-200 transition-all"
                              title="Edit konten"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: 'info-publik', id: item.id })}
                              className="p-2 hover:bg-red-50 text-red-500 rounded-xl border border-gray-200 hover:border-red-200 transition-all"
                              title="Hapus konten"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* CRUD MODAL: Counter Add/Edit (Wireframe: form tambah & form edit) */}
      {showCounterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowCounterModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-[#364146] font-heading mb-6">
              {editingCounter ? 'Edit Detail Loket' : 'Tambah Loket Baru'}
            </h3>

            <form onSubmit={handleSaveCounter} className="flex flex-col gap-4">

              {/* Pilih Cabang — hanya tampil untuk admin */}
              {isAdmin ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cabang</label>
                  <select
                    value={counterForm.id_kantor ?? idKantor}
                    onChange={(e) => setCounterForm({ ...counterForm, id_kantor: e.target.value })}
                    className="border border-gray-250 bg-slate-50 text-gray-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005E60] focus:bg-white transition-all shadow-sm"
                    required
                  >
                    {allBranches.length > 0 ? allBranches.map((b) => (
                      <option key={b.id_kantor} value={b.id_kantor}>{b.nama_kantor} ({b.id_kantor})</option>
                    )) : (
                      <option value={idKantor}>{namaKantor || `Cabang ${idKantor}`}</option>
                    )}
                  </select>
                </div>
              ) : (
                /* Petugas: cabang di-set otomatis, hanya tampilkan info */
                <div className="bg-[#e6f2f2] border border-[#b2e1e3] rounded-xl p-3 flex items-center gap-2">
                  <span className="text-xs font-bold text-[#005E60]">Cabang:</span>
                  <span className="text-xs font-semibold text-[#364146]">{namaKantor || `Cabang ${idKantor}`}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nama Loket</label>
                <input 
                  type="text" 
                  value={counterForm.name}
                  onChange={(e) => setCounterForm({ ...counterForm, name: e.target.value })}
                  placeholder="Contoh: Loket 5, CS 3"
                  required
                  className="border border-gray-250 bg-slate-50 text-gray-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005E60] focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Jenis Layanan</label>
                <select 
                  value={counterForm.type}
                  onChange={(e) => setCounterForm({ ...counterForm, type: e.target.value })}
                  className="border border-gray-250 bg-slate-50 text-gray-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005E60] focus:bg-white transition-all shadow-sm"
                >
                  <option value="Teller">Teller</option>
                  <option value="Kredit">Kredit</option>
                  <option value="Customer Service">Customer Service</option>
                </select>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-gray-100 mt-2">
                <input 
                  type="checkbox" 
                  id="counter_active"
                  checked={counterForm.is_active}
                  onChange={(e) => setCounterForm({ ...counterForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#005E60] focus:ring-[#005E60] border-gray-300 rounded"
                />
                <label htmlFor="counter_active" className="text-xs font-bold text-[#364146]">Aktifkan Loket Ini</label>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="mt-4 w-full bg-[#005E60] hover:bg-[#004a4c] text-white rounded-xl py-4 font-bold transition-all active:scale-[0.98] shadow-md disabled:opacity-50"
              >
                {editingCounter ? 'Simpan Perubahan' : 'Tambah Loket'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CRUD MODAL: Announcement Add/Edit (Wireframe: form tambah & form edit) */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAnnounceModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-[#364146] font-heading mb-6">
              {editingAnnounce ? 'Edit Teks Informasi' : 'Tambah Informasi Baru'}
            </h3>

            <form onSubmit={handleSaveAnnounce} className="flex flex-col gap-4">
              {loggedInUser?.role === 'admin' && idKantor === "01" && (
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Target Kantor Cabang</label>
                  <select
                    value={announceForm.id_kantor}
                    onChange={(e) => setAnnounceForm({ ...announceForm, id_kantor: e.target.value })}
                    className="border border-gray-250 bg-slate-50 text-gray-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005E60] focus:bg-white text-sm"
                  >
                    <option value="">Global (Semua Cabang)</option>
                    {allBranches.map((b) => (
                      <option key={b.id_kantor} value={b.id_kantor}>
                        {b.nama_kantor} ({b.id_kantor})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Isi Pengumuman</label>
                <textarea 
                  value={announceForm.content}
                  onChange={(e) => setAnnounceForm({ ...announceForm, content: e.target.value })}
                  placeholder="Masukkan kalimat pengumuman berjalan..."
                  required
                  rows={4}
                  className="border border-gray-250 bg-slate-50 text-gray-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005E60] focus:bg-white transition-all shadow-sm text-sm"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-gray-100 mt-2">
                <input 
                  type="checkbox" 
                  id="announce_active"
                  checked={announceForm.is_active}
                  onChange={(e) => setAnnounceForm({ ...announceForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#005E60] focus:ring-[#005E60] border-gray-300 rounded"
                />
                <label htmlFor="announce_active" className="text-xs font-bold text-[#364146]">Tampilkan di Monitor TV</label>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="mt-4 w-full bg-[#005E60] hover:bg-[#004a4c] text-white rounded-xl py-4 font-bold transition-all active:scale-[0.98] shadow-md disabled:opacity-50"
              >
                {editingAnnounce ? 'Simpan Perubahan' : 'Tambah Informasi'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CRUD MODAL: InformasiPublik Add/Edit */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowInfoModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-[#364146] font-heading mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#00638a]" />
              {editingInfo ? 'Edit Konten' : 'Tambah Konten Baru'}
            </h3>

            <form onSubmit={handleSaveInfoPublik} className="flex flex-col gap-4">
              {loggedInUser?.role === 'admin' && idKantor === "01" && (
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Target Kantor Cabang</label>
                  <select
                    value={infoForm.id_kantor}
                    onChange={(e) => setInfoForm({ ...infoForm, id_kantor: e.target.value })}
                    className="border border-gray-200 bg-slate-50 text-gray-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#00638a] focus:bg-white text-sm"
                  >
                    <option value="">Global (Semua Cabang)</option>
                    {allBranches.map((b) => (
                      <option key={b.id_kantor} value={b.id_kantor}>
                        {b.nama_kantor} ({b.id_kantor})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Judul */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Judul</label>
                <input
                  type="text"
                  value={infoForm.judul}
                  onChange={(e) => setInfoForm({ ...infoForm, judul: e.target.value })}
                  placeholder="Contoh: Promo Kredit BPR Juli 2025"
                  required
                  className="border border-gray-200 bg-slate-50 text-gray-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#00638a] focus:bg-white transition-all shadow-sm text-sm"
                />
              </div>

              {/* Tipe */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Jenis Konten</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setInfoForm({ ...infoForm, tipe: 'gambar' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${ infoForm.tipe === 'gambar' ? 'border-[#00638a] bg-[#e6f4f8] text-[#00638a]' : 'border-gray-200 text-gray-400 hover:border-gray-300' }`}
                  >
                    <ImageIcon className="w-4 h-4" /> Gambar (URL)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInfoForm({ ...infoForm, tipe: 'youtube' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${ infoForm.tipe === 'youtube' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-400 hover:border-gray-300' }`}
                  >
                    <PlaySquare className="w-4 h-4" /> YouTube
                  </button>
                </div>
              </div>

              {/* URL Konten */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {infoForm.tipe === 'gambar' ? 'URL Gambar' : 'URL YouTube'}
                </label>
                <input
                  type="url"
                  value={infoForm.konten}
                  onChange={(e) => setInfoForm({ ...infoForm, konten: e.target.value })}
                  placeholder={infoForm.tipe === 'gambar' ? 'https://example.com/gambar.jpg' : 'https://www.youtube.com/watch?v=XXXXXX'}
                  required
                  className="border border-gray-200 bg-slate-50 text-gray-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#00638a] focus:bg-white transition-all shadow-sm text-sm"
                />
                {infoForm.konten && infoForm.tipe === 'gambar' && (
                  <div className="mt-2 rounded-xl overflow-hidden h-32 bg-gray-100 border border-gray-200">
                    <img src={infoForm.konten} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                  </div>
                )}
              </div>

              {/* Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tanggal Berlaku</label>
                  <input
                    type="date"
                    value={infoForm.tanggal_berlaku}
                    onChange={(e) => setInfoForm({ ...infoForm, tanggal_berlaku: e.target.value })}
                    className="border border-gray-200 bg-slate-50 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00638a] focus:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tanggal Kadaluarsa</label>
                  <input
                    type="date"
                    value={infoForm.tanggal_kadaluarsa}
                    onChange={(e) => setInfoForm({ ...infoForm, tanggal_kadaluarsa: e.target.value })}
                    className="border border-gray-200 bg-slate-50 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00638a] focus:bg-white"
                  />
                </div>
              </div>

              {/* Urutan & Aktif */}
              <div className="flex gap-4 items-center">
                <div className="flex flex-col gap-1 w-28">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Urutan</label>
                  <input
                    type="number"
                    min={0}
                    value={infoForm.urutan}
                    onChange={(e) => setInfoForm({ ...infoForm, urutan: parseInt(e.target.value) || 0 })}
                    className="border border-gray-200 bg-slate-50 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00638a]"
                  />
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-gray-100 flex-1 mt-4">
                  <input 
                    type="checkbox" 
                    id="info_active"
                    checked={infoForm.is_active}
                    onChange={(e) => setInfoForm({ ...infoForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-[#00638a] focus:ring-[#00638a] border-gray-300 rounded"
                  />
                  <label htmlFor="info_active" className="text-xs font-bold text-[#364146]">Tampilkan di Monitor</label>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full bg-[#00638a] hover:bg-[#004f6e] text-white rounded-xl py-4 font-bold transition-all active:scale-[0.98] shadow-md disabled:opacity-50"
              >
                {editingInfo ? 'Simpan Perubahan' : 'Tambah Konten'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POPUP DELETE CONFIRMATION */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-8 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-lg font-bold text-red-600 font-heading mb-2">Hapus Data</h4>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus {deleteConfirm.type === 'loket' ? 'loket' : deleteConfirm.type === 'informasi' ? 'pengumuman' : 'konten informasi publik'} ini?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-xl py-3 text-xs"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  if (deleteConfirm.type === 'loket') handleDeleteCounter(deleteConfirm.id);
                  else if (deleteConfirm.type === 'informasi') handleDeleteAnnounce(deleteConfirm.id);
                  else handleDeleteInfoPublik(deleteConfirm.id);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-3 text-xs shadow-md"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
