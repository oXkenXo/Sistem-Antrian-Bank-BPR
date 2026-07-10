"use client";

import { useState, useEffect } from "react";
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
  EyeOff
} from "lucide-react";

interface QueueItem {
  id: number;
  ticket_number: string;
  service_type: string;
  prefix: string;
  number: number;
  status: string;
  counter_name: string | null;
  updated_at: string;
}

interface CounterItem {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
}

interface AnnouncementItem {
  id: number;
  content: string;
  is_active: boolean;
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
  const [serviceType, setServiceType] = useState("Teller");
  
  const isAdmin = loggedInUser?.role === "admin";

  // Ambil id_kantor dari query string URL saat halaman dimuat
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id_kantor") || "01";
      setIdKantor(id);

      const fetchBranchName = async () => {
        try {
          const response = await fetch("http://127.0.0.1:8000/api/branches");
          if (response.ok) {
            const data = await response.json();
            setAllBranches(data);
            const current = data.find((b: any) => b.id_kantor === id);
            if (current) setNamaKantor(current.nama_kantor);
          }
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
  const [counterForm, setCounterForm] = useState({ name: "", type: "Teller", is_active: true });

  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [editingAnnounce, setEditingAnnounce] = useState<any | null>(null);
  const [announceForm, setAnnounceForm] = useState({ content: "", is_active: true, id_kantor: "" });
  const [allBranches, setAllBranches] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  // InformasiPublik state
  interface InformasiPublikItem {
    id: number;
    judul: string;
    tipe: 'gambar' | 'youtube' | 'teks_bergulir';
    konten: string;
    tanggal_berlaku: string | null;
    tanggal_kadaluarsa: string | null;
    is_active: boolean;
    urutan: number;
    id_kantor: string | null;
  }
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

  // Fetch all queues, stats, counters, and announcements
  const fetchStatus = async () => {
    // Jangan fetch jika id_kantor belum siap
    if (!idKantor) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/queues/status?id_kantor=${idKantor}`);
      // Abaikan error validasi (422) atau server error (5xx) secara silent
      if (response.status === 422 || response.status >= 500) return;
      if (!response.ok) return;
      const data = await response.json();
      
      setWaitingList(data.waiting || []);
      setStats(data.stats || {
        total_waiting: 0,
        teller_waiting: 0,
        kredit_waiting: 0,
        cs_waiting: 0,
      });

      // Synchronize currently calling ticket for this counter
      if (data.calling && data.calling.length > 0) {
        const myActive = data.calling.find((q: QueueItem) => q.counter_name === counterName);
        setActiveTicket(myActive || null);
      } else {
        setActiveTicket(null);
      }
    } catch (error) {
      // Network error - server mungkin sedang restart, abaikan secara silent
    }
  };

  // Fetch Counters List for CRUD
  const fetchCounters = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/counters?id_kantor=${idKantor}`);
      if (response.ok) {
        const data = await response.json();
        setCounters(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Announcements List (Teks Bergulir)
  const fetchAnnouncements = async () => {
    try {
      const url = (loggedInUser?.role === 'admin' && idKantor === '01')
        ? `http://127.0.0.1:8000/api/informasi-publik`
        : `http://127.0.0.1:8000/api/informasi-publik?id_kantor=${idKantor}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const texts = data
          .filter((item: any) => item.tipe === 'teks_bergulir')
          .map((item: any) => ({
            id: item.id,
            content: item.konten,
            is_active: item.is_active,
            id_kantor: item.id_kantor
          }));
        setAnnouncements(texts);
      }
    } catch (e) { console.error(e); }
  };

  // Fetch InformasiPublik List (Media Gambar/Youtube)
  const fetchInformasiPublik = async () => {
    try {
      const url = (loggedInUser?.role === 'admin' && idKantor === '01')
        ? `http://127.0.0.1:8000/api/informasi-publik`
        : `http://127.0.0.1:8000/api/informasi-publik?id_kantor=${idKantor}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const mediaList = data.filter((item: any) => item.tipe === 'gambar' || item.tipe === 'youtube');
        setInfoPublikList(mediaList);
      }
    } catch (e) { console.error(e); }
  };

  // Save InformasiPublik (add/edit)
  const handleSaveInfoPublik = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = editingInfo
        ? `http://127.0.0.1:8000/api/informasi-publik/${editingInfo.id}`
        : `http://127.0.0.1:8000/api/informasi-publik`;
      const method = editingInfo ? 'PUT' : 'POST';

      const targetIdKantor = (loggedInUser?.role === 'admin' && idKantor === "01")
        ? (infoForm.id_kantor || null)
        : idKantor;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          ...infoForm,
          id_kantor: targetIdKantor,
          tanggal_berlaku: infoForm.tanggal_berlaku || null,
          tanggal_kadaluarsa: infoForm.tanggal_kadaluarsa || null,
        }),
      });
      if (response.ok) {
        setShowInfoModal(false);
        fetchInformasiPublik();
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  // Delete InformasiPublik (Optimistic Update)
  const handleDeleteInfoPublik = async (id: number) => {
    const previousList = [...infoPublikList];
    setInfoPublikList(prev => prev.filter(i => i.id !== id));
    setDeleteConfirm(null);
    try {
      await fetch(`http://127.0.0.1:8000/api/informasi-publik/${id}`, { method: 'DELETE' });
      fetchInformasiPublik();
    } catch (e) { 
      console.error(e); 
      setInfoPublikList(previousList);
    }
  };

  // Toggle active status inline (Optimistic Update)
  const handleToggleInfoActive = async (item: InformasiPublikItem) => {
    const previousList = [...infoPublikList];
    setInfoPublikList(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    try {
      await fetch(`http://127.0.0.1:8000/api/informasi-publik/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          judul: item.judul,
          tipe: item.tipe,
          konten: item.konten,
          tanggal_berlaku: item.tanggal_berlaku,
          tanggal_kadaluarsa: item.tanggal_kadaluarsa,
          is_active: !item.is_active,
          urutan: item.urutan,
          id_kantor: item.id_kantor
        }),
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
      const response = await fetch("http://127.0.0.1:8000/api/queues/call-next", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          id_kantor: idKantor, // Kirim id_kantor cabang
          counter_name: counterName,
          service_type: serviceType,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || "Gagal memanggil antrean berikutnya.");
      }

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
      const response = await fetch("http://127.0.0.1:8000/api/queues/recall", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          queue_id: activeTicket.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal memanggil ulang antrean.");
      }
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
      const response = await fetch("http://127.0.0.1:8000/api/queues/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          queue_id: activeTicket.id,
        }),
      });

      if (response.ok) {
        setActiveTicket(null);
        fetchStatus();
      }
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
      const response = await fetch("http://127.0.0.1:8000/api/queues/skip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          queue_id: activeTicket.id,
        }),
      });

      if (response.ok) {
        setActiveTicket(null);
        fetchStatus();
      }
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
      const response = await fetch("http://127.0.0.1:8000/api/queues/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          id_kantor: idKantor, // Kirim id_kantor cabang
        }),
      });
      if (response.ok) {
        setActiveTicket(null);
        fetchStatus();
      }
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
    const url = editingCounter 
      ? `http://127.0.0.1:8000/api/counters/${editingCounter.id}` 
      : "http://127.0.0.1:8000/api/counters";
    const method = editingCounter ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...counterForm,
          id_kantor: idKantor, // Kirim id_kantor cabang
        }),
      });

      if (response.ok) {
        setShowCounterModal(false);
        setEditingCounter(null);
        setCounterForm({ name: "", type: "Teller", is_active: true });
        fetchCounters();
      } else {
        const err = await response.json();
        alert(err.message || "Gagal menyimpan loket.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD - Delete Counter (Optimistic Update)
  const handleDeleteCounter = async (id: number) => {
    const previousCounters = [...counters];
    setCounters(prev => prev.filter(c => c.id !== id));
    setDeleteConfirm(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/counters/${id}`, {
        method: "DELETE",
      });
      fetchCounters();
    } catch (e) {
      console.error(e);
      setCounters(previousCounters);
    }
  };

  // CRUD - Save Announcement (Disimpan ke informasi-publik dengan tipe teks_bergulir)
  const handleSaveAnnounce = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const url = editingAnnounce 
      ? `http://127.0.0.1:8000/api/informasi-publik/${editingAnnounce.id}` 
      : "http://127.0.0.1:8000/api/informasi-publik";
    const method = editingAnnounce ? "PUT" : "POST";

    const targetIdKantor = (loggedInUser?.role === 'admin' && idKantor === "01")
      ? (announceForm.id_kantor || null)
      : idKantor;

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          id_kantor: targetIdKantor,
          judul: editingAnnounce ? `Running Text ${editingAnnounce.id}` : 'Running Text Baru',
          tipe: 'teks_bergulir',
          konten: announceForm.content,
          is_active: announceForm.is_active,
          urutan: 0
        }),
      });

      if (response.ok) {
        setShowAnnounceModal(false);
        setEditingAnnounce(null);
        setAnnounceForm({ content: "", is_active: true, id_kantor: "" });
        fetchAnnouncements();
      } else {
        const err = await response.json();
        alert(err.message || "Gagal menyimpan pengumuman.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD - Delete Announcement (Optimistic Update)
  const handleDeleteAnnounce = async (id: number) => {
    const previousAnnouncements = [...announcements];
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/informasi-publik/${id}`, {
        method: "DELETE",
      });
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
      const interval = setInterval(fetchStatus, 5000);
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
      const stored = sessionStorage.getItem(`user_${idKantor}`);
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u.role === 'admin' || u.id_kantor === idKantor) {
            setLoggedInUser(u);
            // Jangan langsung setIsConfigured(true) agar petugas/admin bisa memilih nomor loket & layanan terlebih dahulu.
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
      setIsConfigured(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

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
          id_kantor: idKantor,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || "Gagal masuk ke panel loket.");
      }

      setLoggedInUser(resData.user);
      setIsConfigured(true);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Login/Config Screen (Wireframe: page petugas)
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00383a] via-[#005E60] to-[#002f31] p-6">
        <form 
          onSubmit={handleLoginSubmit}
          className="bg-white rounded-[32px] w-full max-w-md p-8 md:p-10 shadow-2xl border border-gray-100 flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        >
          
          {/* Top Logo Banner */}
          <div className="flex items-center gap-3 justify-center mb-8 border-b pb-6">
            <img 
              alt="BPR Kerta Raharja Logo" 
              className="h-10 w-auto object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy_PuUGIg6TcQonvnrv6ChV2tYXRE9vUggKMMgCxgxhRuXOAR7d9HS89fGozDfGiPO7VB1_XILA462zY4-y7rIBw5IZMOMqDS39L2JBtPe3M4wqKYvHrhQ2yz9GDx4h91Ej7rQhMZePA5RMX8EKLGhANiiYcCX4oUDdB8SkCXb1XitQqo69ZO5G5lkJVH12RUQfg4srNQeClopYv2Ike-yRyP-U3N1S4HA842PFSAuFRWGmig0lFIIfXDs2kOdoj01zxU"
            />
            <span className="font-heading font-extrabold text-xl text-[#005E60] border-l pl-3 border-gray-200">
              Loket Petugas
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[#364146] mb-2 font-heading flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#005E60]" />
            Masuk Loket
          </h2>
          <p className="text-gray-500 text-xs mb-6 leading-relaxed">
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
                  sessionStorage.removeItem(`user_${idKantor}`);
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
                onChange={(e) => setCounterName(e.target.value)}
                className="border border-gray-200 bg-slate-50 text-gray-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005E60] focus:bg-white transition-all shadow-sm"
              >
                <optgroup label="Daftar Loket Cabang">
                  {counters.length > 0 ? (
                    counters.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="Teller 1">Teller 1</option>
                      <option value="Teller 2">Teller 2</option>
                      <option value="Customer Service 1">Customer Service 1</option>
                    </>
                  )}
                </optgroup>
              </select>
            </div>

            {/* Service Type Selection */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Kategori Pelayanan</label>
              <select 
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="border border-gray-200 bg-slate-50 text-gray-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005E60] focus:bg-white transition-all shadow-sm"
              >
                <option value="Teller">Teller (Prefix A)</option>
                <option value="Kredit">Kredit (Prefix B)</option>
                <option value="Customer Service">Customer Service (Prefix C)</option>
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
            {isAdmin && (
              <>
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

        {/* TAB 1: Antrean Loket Calling Screen (Wireframe: page petugas 3) */}
        {activeTab === 'antrean' && (
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Calling Desk Console */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6">
              <div className="bg-white rounded-[28px] border border-gray-200 shadow-xl p-8 flex flex-col justify-between min-h-[350px] relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#005E60] to-[#008285]"></div>
                
                {/* Header */}
                <div className="flex justify-between items-center border-b pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status Loket: Aktif</span>
                  </div>
                  <div className="text-xs font-bold text-[#005E60] bg-[#e6f2f2] px-3 py-1 rounded-full border border-[#b2e1e3]">
                    {serviceType} Desk
                  </div>
                </div>

                {/* Big Number Now (Wireframe: nomor sekarang) */}
                <div className="flex-grow flex flex-col justify-center items-center py-6 text-center">
                  {activeTicket ? (
                    <div className="animate-in zoom-in-95 duration-200">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block mb-1">Nomor Sekarang</span>
                      <div className="text-7xl md:text-8xl font-mono font-extrabold text-[#005E60] tracking-tight drop-shadow-sm mb-4 leading-none animate-pulse">
                        {activeTicket.ticket_number}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        Mulai Dilayani: {new Date(activeTicket.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <span className="text-6xl font-mono font-extrabold block mb-2">---</span>
                      <span className="text-xs tracking-wider uppercase font-bold">Tidak Ada Antrean Aktif</span>
                      <p className="text-xs max-w-[250px] mx-auto text-gray-400 mt-1 leading-relaxed">
                        Klik tombol "Panggil Berikutnya" di bawah untuk memanggil antrean pertama.
                      </p>
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-xl p-3 text-center mb-4">
                    {errorMessage}
                  </div>
                )}

                {/* Counter Actions (Wireframe: panggil ulang, skip nomor, selesai pelayanan, reset antrian) */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 border-t pt-6">
                  
                  {/* Call Next */}
                  <button 
                    onClick={handleCallNext}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-[#005E60] to-[#008285] hover:from-[#004a4c] hover:to-[#005E60] text-white rounded-xl py-4 font-bold flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all border-b-4 border-[#00383a] disabled:opacity-50"
                  >
                    <PhoneCall className="w-5 h-5" />
                    <span className="text-xs">Panggil Berikut</span>
                  </button>

                  {/* Recall (Panggil Ulang) */}
                  <button 
                    onClick={handleRecall}
                    disabled={isLoading || !activeTicket}
                    className="bg-white hover:bg-slate-50 border border-gray-250 text-gray-700 rounded-xl py-4 font-bold flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all disabled:opacity-40"
                  >
                    <RefreshCw className="w-5 h-5 text-gray-500" />
                    <span className="text-xs">Panggil Ulang</span>
                  </button>

                  {/* Skip (Skip Nomor) */}
                  <button 
                    onClick={handleSkip}
                    disabled={isLoading || !activeTicket}
                    className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 rounded-xl py-4 font-bold flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all disabled:opacity-40"
                  >
                    <SkipForward className="w-5 h-5" />
                    <span className="text-xs">Skip Nomor</span>
                  </button>

                  {/* Complete (Selesai Pelayanan) */}
                  <button 
                    onClick={handleComplete}
                    disabled={isLoading || !activeTicket}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-4 font-bold flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all disabled:opacity-40 border-b-4 border-green-800"
                  >
                    <Check className="w-5 h-5" />
                    <span className="text-xs">Selesai Layanan</span>
                  </button>

                  {/* Reset (Reset Antrian) */}
                  <button 
                    onClick={handleResetQueues}
                    disabled={isLoading}
                    className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl py-4 font-bold flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all col-span-2 lg:col-span-1"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-xs">Reset Antrean</span>
                  </button>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-250 shadow-sm p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Total Menunggu</span>
                  <span className="text-2xl font-extrabold font-mono text-[#005E60] mt-0.5">{stats.total_waiting}</span>
                </div>
                <div className="bg-white border border-gray-250 shadow-sm p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Menunggu Teller</span>
                  <span className="text-2xl font-extrabold font-mono text-[#364146] mt-0.5">{stats.teller_waiting}</span>
                </div>
                <div className="bg-white border border-gray-250 shadow-sm p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Menunggu Kredit</span>
                  <span className="text-2xl font-extrabold font-mono text-[#364146] mt-0.5">{stats.kredit_waiting}</span>
                </div>
                <div className="bg-white border border-gray-250 shadow-sm p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Menunggu CS</span>
                  <span className="text-2xl font-extrabold font-mono text-[#364146] mt-0.5">{stats.cs_waiting}</span>
                </div>
              </div>
            </div>

            {/* Waiting List Sidebar */}
            <div className="w-full lg:w-1/3 flex flex-col">
              <div className="bg-white rounded-[28px] border border-gray-100 shadow-2xl flex-grow flex flex-col overflow-hidden min-h-[400px]">
                
                {/* Sidebar Header Gradient */}
                <div className="bg-gradient-to-br from-[#005E60] to-[#008285] px-6 py-4 flex items-center justify-between rounded-t-[28px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] text-white/60 font-bold uppercase tracking-widest leading-none">Daftar Tunggu</p>
                      <h4 className="font-heading font-extrabold text-white text-sm leading-tight">
                        Antrean {serviceType}
                      </h4>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-3 py-1.5 min-w-[52px] text-center">
                    <span className="text-2xl font-mono font-extrabold text-white leading-none">{serviceWaitingList.length}</span>
                    <span className="text-[8px] text-white/70 font-bold uppercase tracking-wider">Tiket</span>
                  </div>
                </div>

                {/* Ticket List */}
                <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2.5 max-h-[60vh]
                  [&::-webkit-scrollbar]:w-1.5
                  [&::-webkit-scrollbar-track]:bg-gray-50
                  [&::-webkit-scrollbar-thumb]:bg-gray-200
                  [&::-webkit-scrollbar-thumb]:rounded-full">
                  {serviceWaitingList.length > 0 ? (
                    serviceWaitingList.map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between rounded-2xl p-3.5 transition-all duration-300 ${
                          index === 0
                            ? "bg-gradient-to-r from-[#005E60]/10 to-[#008285]/5 border-2 border-[#005E60]/25 shadow-sm"
                            : index === 1
                            ? "bg-blue-50/60 border border-blue-100"
                            : "bg-slate-50/70 border border-gray-100"
                        }`}
                      >
                        {/* Position number + ticket */}
                        <div className="flex items-center gap-3">
                          {/* Position Badge */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm shadow-md flex-shrink-0 ${
                            index === 0
                              ? "bg-gradient-to-br from-[#005E60] to-[#008285] text-white"
                              : index === 1
                              ? "bg-blue-500 text-white"
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
                            <span className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5 block">
                              Daftar: {new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                            </span>
                          </div>
                        </div>

                        {/* Badge status */}
                        {index === 0 && (
                          <span className="text-[9px] bg-gradient-to-r from-[#005E60] to-[#008285] text-white font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
                            <Sparkles className="w-2.5 h-2.5" />
                            Berikutnya
                          </span>
                        )}
                        {index === 1 && (
                          <span className="text-[9px] bg-blue-100 border border-blue-200 text-blue-600 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            #2
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-16 text-gray-400">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Layers className="w-8 h-8 text-gray-300" />
                      </div>
                      <span className="text-sm font-bold text-gray-400 block mb-1">Antrean Kosong</span>
                      <p className="text-xs max-w-[180px] leading-relaxed text-gray-400">
                        Belum ada tiket menunggu untuk layanan {serviceType}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Kelola Loket (Wireframe: page kelola loket) */}
        {activeTab === 'loket' && (
          <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl p-8 flex flex-col min-h-[450px]">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#364146] font-heading flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#005E60]" />
                  Kelola Daftar Loket (Counters)
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">Tambah, edit, dan hapus loket teller/kredit/CS yang aktif di bank.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingCounter(null);
                  setCounterForm({ name: "", type: "Teller", is_active: true });
                  setShowCounterModal(true);
                }}
                className="bg-[#005E60] hover:bg-[#004a4c] text-white rounded-xl px-5 py-3 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Tambah Loket Baru
              </button>
            </div>

            {/* List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {counters.length > 0 ? (
                counters.map((c) => (
                  <div 
                    key={c.id}
                    className={`rounded-[24px] border p-6 shadow-sm flex flex-col justify-between min-h-[160px] relative transition-all ${
                      c.is_active 
                        ? 'bg-green-50/20 border-green-200' 
                        : 'bg-slate-50/50 border-gray-200 opacity-70'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{c.type}</span>
                      <h4 className="font-heading font-extrabold text-lg text-[#364146] mt-1">{c.name}</h4>
                    </div>

                    <div className="flex items-center justify-between border-t pt-4 mt-4">
                      {/* Active Status Indicator */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>

                      {/* CRUD Buttons (pencil and X icons on top right/left on wireframe, grouped here for UI convenience) */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingCounter(c);
                            setCounterForm({ name: c.name, type: c.type, is_active: c.is_active });
                            setShowCounterModal(true);
                          }}
                          className="p-2 hover:bg-slate-100 text-blue-500 rounded-lg border border-gray-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm({ type: 'loket', id: c.id })}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg border border-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 text-gray-400">
                  Tidak ada loket terdaftar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Kelola Informasi (Wireframe: page kelola informasi) */}
        {activeTab === 'informasi' && (
          <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl p-8 flex flex-col min-h-[450px]">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#364146] font-heading flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#005E60]" />
                  Kelola Teks Informasi Publik (Announcements)
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">Atur teks informasi berjalan yang tampil di bagian bawah monitor utama.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingAnnounce(null);
                  setAnnounceForm({ content: "", is_active: true, id_kantor: "" });
                  setShowAnnounceModal(true);
                }}
                className="bg-[#005E60] hover:bg-[#004a4c] text-white rounded-xl px-5 py-3 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Tambah Teks Baru
              </button>
            </div>

            {/* List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {announcements.length > 0 ? (
                announcements.map((a) => (
                  <div 
                    key={a.id}
                    className={`rounded-[24px] border p-6 shadow-sm flex flex-col justify-between min-h-[160px] relative transition-all ${
                      a.is_active 
                        ? 'bg-green-50/20 border-green-200' 
                        : 'bg-slate-50/50 border-gray-200 opacity-70'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        Teks Informasi {a.id_kantor ? `• Cabang ${a.id_kantor}` : "• Global (Pusat)"}
                      </span>
                      <p className="font-semibold text-sm text-[#364146] mt-2 leading-relaxed">{a.content}</p>
                    </div>

                    <div className="flex items-center justify-between border-t pt-4 mt-4">
                      {/* Active indicator */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {a.is_active ? 'Tampil di TV' : 'Disembunyikan'}
                      </span>

                      {/* CRUD Buttons */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingAnnounce(a);
                            setAnnounceForm({ content: a.content, is_active: a.is_active, id_kantor: a.id_kantor || "" });
                            setShowAnnounceModal(true);
                          }}
                          className="p-2 hover:bg-slate-100 text-blue-500 rounded-lg border border-gray-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm({ type: 'informasi', id: a.id })}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg border border-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 text-gray-400">
                  Tidak ada teks informasi terdaftar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Informasi Publik (Gambar & YouTube untuk Monitor Display) */}
        {activeTab === 'info-publik' && (
          <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl p-8 flex flex-col min-h-[450px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#364146] font-heading flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#00638a]" />
                  Informasi Publik — Galeri Display
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">Kelola gambar dan video YouTube yang tampil di panel kanan Monitor Display. Hanya konten aktif dan belum kadaluarsa yang ditampilkan.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingInfo(null);
                  setInfoForm({ judul: '', tipe: 'gambar', konten: '', tanggal_berlaku: '', tanggal_kadaluarsa: '', is_active: true, urutan: 0, id_kantor: '' });
                  setShowInfoModal(true);
                }}
                className="bg-[#00638a] hover:bg-[#004f6e] text-white rounded-xl px-5 py-3 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-[0.98] whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Tambah Konten
              </button>
            </div>

            {infoPublikList.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-gray-400 py-16">
                <ImageIcon className="w-16 h-16 mb-4 text-gray-200" />
                <p className="font-semibold">Belum ada konten informasi publik</p>
                <p className="text-xs mt-1">Klik "Tambah Konten" untuk mulai menambahkan gambar atau video</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {infoPublikList.map((item) => {
                  const isYoutube = item.tipe === 'youtube';
                  const ytId = isYoutube ? item.konten.match(/(?:youtu\.be\/|embed\/|watch\?v=|&v=)([^#&?]{11})/)?.[1] : null;
                  const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : item.konten;

                  return (
                    <div key={item.id} className={`rounded-[20px] border overflow-hidden shadow-sm transition-all ${ item.is_active ? 'border-[#00638a]/30' : 'border-gray-200 opacity-60' }`}>
                      {/* Thumbnail */}
                      <div className="relative h-40 bg-gray-900 overflow-hidden">
                        <img
                          src={isYoutube ? thumbUrl! : item.konten}
                          alt={item.judul}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x240?text=Preview'; }}
                        />
                        {isYoutube && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="bg-red-600 rounded-full p-3">
                              <PlaySquare className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}
                        <div className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${ isYoutube ? 'bg-red-600 text-white' : 'bg-[#00638a] text-white' }`}>
                          {item.tipe} {item.id_kantor ? `(${item.id_kantor})` : "(Global)"}
                        </div>
                        <div className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${ item.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white' }`}>
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 bg-white">
                        <p className="font-bold text-sm text-[#364146] truncate">{item.judul}</p>
                        {item.urutan > 0 && <p className="text-[10px] text-gray-400 mt-0.5">Urutan: {item.urutan}</p>}
                        {item.tanggal_kadaluarsa && (
                          <p className="text-[10px] text-amber-600 mt-0.5">Exp: {item.tanggal_kadaluarsa}</p>
                        )}
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleToggleInfoActive(item)}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${ item.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' }`}
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
                            className="p-1.5 hover:bg-slate-100 text-blue-500 rounded-lg border border-gray-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'info-publik', id: item.id })}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg border border-red-100"
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
