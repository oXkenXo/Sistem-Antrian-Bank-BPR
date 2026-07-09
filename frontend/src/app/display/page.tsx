"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, Megaphone, Image as ImageIcon, PlaySquare } from "lucide-react";

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

interface BiRateData {
  bi_rate: number;
  bi_rate_str: string;
  period: string;
  source: string;
}

interface InformasiPublikItem {
  id: number;
  judul: string;
  tipe: "gambar" | "youtube";
  konten: string;
  tanggal_berlaku: string | null;
  tanggal_kadaluarsa: string | null;
  is_active: boolean;
  urutan: number;
}

// Extract YouTube video ID from various URL formats
function getYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function DisplayPage() {
  const [callingQueues, setCallingQueues] = useState<QueueItem[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [counters, setCounters] = useState<CounterItem[]>([]);
  const [biRate, setBiRate] = useState<BiRateData | null>(null);
  const [informasiList, setInformasiList] = useState<InformasiPublikItem[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Track last announced timestamps to prevent duplicate announcements
  const announcedRef = useRef<Record<number, string>>({});

  // Synthesize "ding-dong" chime using Web Audio API
  const playChime = async (audioCtx: AudioContext) => {
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, startTime);

      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    playNote(392, now, 0.4);
    playNote(523, now + 0.35, 0.6);

    return new Promise((resolve) => setTimeout(resolve, 950));
  };

  const speakText = (text: string) => {
    return new Promise<void>((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices.find(v => v.lang.startsWith("id") && v.localService);
      if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith("id"));
      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  };

  const triggerAudioCall = async (ticket: QueueItem) => {
    if (!audioEnabled || !audioCtxRef.current) return;
    try {
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === "suspended") await audioCtx.resume();
      await playChime(audioCtx);
      const vocalText = `Nomor antrean ${ticket.prefix}, ${ticket.number}, silakan menuju ke ${ticket.counter_name || "Loket"}`;
      await speakText(vocalText);
    } catch (e) {
      console.error("Gagal memutar audio panggilan:", e);
    }
  };

  // Poll queue status + counters
  const fetchStatus = async () => {
    try {
      const [resStatus, resCounters] = await Promise.all([
        fetch("http://localhost:8000/api/queues/status"),
        fetch("http://localhost:8000/api/counters")
      ]);
      if (!resStatus.ok || !resCounters.ok) throw new Error("Gagal mengambil data");

      const data = await resStatus.json();
      const countersData = await resCounters.json();

      setCallingQueues(data.calling || []);
      setAnnouncements(data.announcements || []);
      setCounters(countersData.filter((c: CounterItem) => c.is_active) || []);

      if (data.calling && data.calling.length > 0) {
        data.calling.forEach((ticket: QueueItem) => {
          const lastTime = announcedRef.current[ticket.id];
          if (!lastTime || lastTime !== ticket.updated_at) {
            announcedRef.current[ticket.id] = ticket.updated_at;
            triggerAudioCall(ticket);
          }
        });
      }
    } catch (error) {
      console.error("Error polling status:", error);
    }
  };

  // Fetch active informasi publik
  const fetchInformasi = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/informasi-publik/aktif");
      if (res.ok) {
        const data = await res.json();
        setInformasiList(data);
      }
    } catch (e) {
      console.error("Error fetching informasi publik:", e);
    }
  };

  // Fetch BI Rate
  const fetchBiRate = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/interest-rate");
      if (res.ok) setBiRate(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchStatus();
    fetchBiRate();
    fetchInformasi();
    const rateInterval = setInterval(fetchBiRate, 30 * 60 * 1000);
    const infoInterval = setInterval(fetchInformasi, 30 * 1000); // refresh every 30s
    const statusInterval = setInterval(fetchStatus, 3000);
    return () => {
      clearInterval(statusInterval);
      clearInterval(rateInterval);
      clearInterval(infoInterval);
    };
  }, [audioEnabled]);

  // Auto-slideshow for informasi publik panel
  useEffect(() => {
    if (informasiList.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % informasiList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [informasiList.length]);

  // Unlock audio on first click anywhere
  useEffect(() => {
    const handleClick = () => {
      if (!audioEnabled) enableAudio();
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [audioEnabled]);

  const enableAudio = () => {
    setAudioEnabled(true);
    announcedRef.current = {};
    if (typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        if (audioCtx.state === "suspended") audioCtx.resume();
        audioCtxRef.current = audioCtx;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(0);
        osc.stop(0.1);
      }
    }
  };

  const activeInfo = informasiList[activeSlide];

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] h-screen flex flex-col overflow-hidden font-sans relative select-none">

      {/* ── HEADER ─────────────────────────────────────── */}
      <header className="bg-white shadow-sm w-full top-0 z-10 shrink-0">
        <div className="flex justify-between items-center w-full px-6 py-1.5 h-[56px]">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 p-1 rounded-xl border border-gray-100 flex items-center gap-2 shadow-sm">
              <img
                alt="BPR Kerta Raharja Logo"
                className="h-6 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy_PuUGIg6TcQonvnrv6ChV2tYXRE9vUggKMMgCxgxhRuXOAR7d9HS89fGozDfGiPO7VB1_XILA462zY4-y7rIBw5IZMOMqDS39L2JBtPe3M4wqKYvHrhQ2yz9GDx4h91Ej7rQhMZePA5RMX8EKLGhANiiYcCX4oUDdB8SkCXb1XitQqo69ZO5G5lkJVH12RUQfg4srNQeClopYv2Ike-yRyP-U3N1S4HA842PFSAuFRWGmig0lFIIfXDs2kOdoj01zxU"
              />
              <img
                alt="BPR Logo"
                className="h-6 w-auto object-contain border-l pl-2 border-gray-200"
                src="https://lh3.googleusercontent.com/aida/AP1WRLvrPpBEMH26EO7GTocTY_KMD1TjlLHO36PMJh-oekRfNCpqp-fBJ3mM_h0WqzDjutLaXllTzKo4eGOtWKjSQoPXrO2tu-L7gxPmuowrCMXpqaOdRr68BgvdCMdcFjFuTXyZXhPWYwcbY2I4iuPkpIK_4Jvj0DZ5Ywi4Vr_sm5nVcuM3JY3qlEdaASfvVbIbsVhM79lu-tdVFjBk1Wn5xgUSEpVu2LyAsNKSHd2Vcg4e1h5NaS_uOUtOysO2"
              />
            </div>
            <div className="text-lg font-extrabold text-[#0099D3] tracking-tight font-heading border-l pl-3 border-gray-200">
              Display Antrean
            </div>
          </div>

          {/* Service Hour Info */}
          <div className="flex items-center gap-2 bg-[#e6f2f2] text-[#005E60] px-3 py-1 rounded-lg font-bold text-[11px] border border-[#b2e1e3]">
            <Clock className="w-3.5 h-3.5 animate-pulse text-[#005E60]" />
            <span>Senin - Jumat: 08:00 - 15:00</span>
          </div>
        </div>
      </header>

      {/* ── MAIN: 2-COLUMN LAYOUT ─────────────────────── */}
      <main className="flex-grow flex overflow-hidden bg-gradient-to-b from-[#f3f4f5] to-[#f8f9fa] p-4 gap-4 min-h-0">

        {/* ── LEFT: Counter Cards ──────────────────────── */}
        <div className="flex-[3] flex flex-col gap-4 min-h-0 overflow-hidden">
          {counters.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-[#6b767c]">
              <div className="w-12 h-12 border-4 border-[#00638a]/20 border-t-[#00638a] rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-semibold">Memuat data loket...</p>
            </div>
          ) : (
            <div
              className="grid gap-4 h-full"
              style={{ gridTemplateColumns: `repeat(${Math.min(counters.length, 2)}, minmax(0, 1fr))`, gridTemplateRows: counters.length > 2 ? "1fr 1fr" : "1fr" }}
            >
              {counters.map((c, index) => {
                const currentCalling = callingQueues.find((q) => q.counter_name === c.name);
                const shimmerDelay = `${index * 0.5}s`;

                if (currentCalling) {
                  return (
                    <div
                      key={c.name}
                      className="bg-white rounded-xl shadow-lg flex flex-col overflow-hidden border border-gray-100 min-h-0"
                      style={{ boxShadow: "0 10px 25px -5px rgba(0,153,211,0.12)" }}
                    >
                      <div className="bg-[#00638a] py-4 px-4 text-center border-b-[6px] border-[#FFFF00] relative overflow-hidden shrink-0">
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"
                          style={{ animationDelay: shimmerDelay }}
                        ></div>
                        <h2 className="text-xl font-extrabold text-white m-0 relative z-10 font-heading">{c.name}</h2>
                      </div>
                      <div className="flex-grow flex flex-col items-center justify-center p-6 bg-white relative">
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                            Melayani
                          </span>
                        </div>
                        <div className="text-[#6b767c] text-[10px] font-bold mb-2 tracking-widest uppercase">Nomor Antrean</div>
                        <div className="text-[clamp(48px,8vw,80px)] leading-none font-bold text-[#0099D3] tracking-tighter font-mono whitespace-nowrap">
                          {currentCalling.ticket_number}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={c.name}
                      className="bg-[#f8f9fa] rounded-xl shadow-md flex flex-col overflow-hidden opacity-80 grayscale-[20%] border border-gray-200 min-h-0"
                    >
                      <div className="bg-[#00638a] py-4 px-4 text-center border-b-[6px] border-[#e1e3e4] shrink-0">
                        <h2 className="text-xl font-extrabold text-white m-0 font-heading">{c.name}</h2>
                      </div>
                      <div className="flex-grow flex flex-col items-center justify-center p-6 bg-[#f3f4f5] relative">
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#e1e3e4] text-[#3e484f] border border-[#bec8d1]">
                            Kosong
                          </span>
                        </div>
                        <div className="text-[#6b767c] text-[10px] font-bold mb-2 tracking-widest uppercase">Nomor Antrean</div>
                        <div className="text-[clamp(48px,8vw,80px)] leading-none font-bold text-[#e1e3e4] tracking-tighter font-mono whitespace-nowrap">
                          ---
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Informasi Publik Panel ──────────── */}
        <div className="flex-[2] bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden min-h-0">

          {/* Panel header */}
          <div className="bg-[#00638a] px-5 py-3 flex items-center gap-2 shrink-0 border-b-[4px] border-[#FFFF00]">
            <ImageIcon className="w-4 h-4 text-[#FFFF00]" />
            <span className="text-white font-bold text-sm tracking-wide uppercase">Informasi BPR</span>
          </div>

          {/* Slide content */}
          {informasiList.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-[#6b767c] p-8 text-center">
              <ImageIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p className="font-semibold text-lg">Belum ada informasi publik</p>
              <p className="text-sm mt-2 opacity-60">Tambahkan gambar atau video di panel petugas</p>
            </div>
          ) : (
            <div className="flex-grow flex flex-col relative overflow-hidden min-h-0">
              {/* Slide */}
              {informasiList.map((info, idx) => (
                <div
                  key={info.id}
                  className={`absolute inset-0 flex flex-col transition-opacity duration-700 ${idx === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                >
                  {/* Media */}
                  <div className="flex-grow bg-black overflow-hidden min-h-0">
                    {info.tipe === "gambar" ? (
                      <img
                        src={info.konten}
                        alt={info.judul}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x600?text=Gambar+Tidak+Tersedia";
                        }}
                      />
                    ) : (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeId(info.konten)}?autoplay=${idx === activeSlide ? 1 : 0}&mute=1&loop=1&controls=0&playlist=${getYoutubeId(info.konten)}`}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        title={info.judul}
                      />
                    )}
                  </div>

                  {/* Judul bar */}
                  <div className="bg-gradient-to-r from-[#00638a] to-[#00638a]/80 px-5 py-3 shrink-0">
                    <div className="flex items-center gap-2">
                      {info.tipe === "youtube" ? (
                        <PlaySquare className="w-4 h-4 text-red-400 flex-shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-[#FFFF00] flex-shrink-0" />
                      )}
                      <p className="text-white font-semibold text-sm truncate">{info.judul}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Slide dots indicator */}
              {informasiList.length > 1 && (
                <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-2 z-20">
                  {informasiList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === activeSlide ? "bg-[#FFFF00] scale-125" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── MARQUEE FOOTER ─────────────────────────────── */}
      <footer className="bg-[#00638a] text-white h-[70px] shrink-0 flex items-center overflow-hidden border-t-4 border-[#FFFF00] relative z-20">
        <div className="bg-[#364146] text-[#FFFF00] font-bold text-xl h-full flex items-center px-6 z-10 shadow-lg tracking-wide uppercase whitespace-nowrap min-w-[180px] justify-center border-r border-[#00638a]/20">
          <Megaphone className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>Info BPR</span>
        </div>

        <div className="overflow-hidden flex-grow h-full flex items-center bg-[#00638a] relative">
          <div className="animate-marquee whitespace-nowrap flex items-center text-[22px] font-semibold text-white">
            {biRate && (
              <>
                <span className="mx-6 text-[#FFFF00] text-xl">◆</span>
                <span className="flex items-center gap-3">
                  <span className="bg-[#FFFF00] text-[#00638a] font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">BI Rate</span>
                  <span className="font-bold">{biRate.bi_rate_str}</span>
                  <span className="text-white/70 text-base">per {biRate.period}</span>
                </span>
              </>
            )}

            {announcements.length > 0 ? (
              announcements.map((text, idx) => (
                <span key={idx} className="flex items-center">
                  <span className="mx-6 text-[#FFFF00] text-xl">◆</span>
                  {text}
                </span>
              ))
            ) : (
              <>
                <span className="mx-6 text-[#FFFF00] text-xl">◆</span>
                Selamat Datang di Bank BPR Kerta Raharja. Silakan ambil nomor antrean Anda.
                <span className="mx-6 text-[#FFFF00] text-xl">◆</span>
                Budayakan mengantre demi ketertiban bersama di lingkungan Bank.
              </>
            )}

            {/* Duplicate for seamless loop */}
            {biRate && (
              <>
                <span className="mx-6 text-[#FFFF00] text-xl">◆</span>
                <span className="flex items-center gap-3">
                  <span className="bg-[#FFFF00] text-[#00638a] font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">BI Rate</span>
                  <span className="font-bold">{biRate.bi_rate_str}</span>
                  <span className="text-white/70 text-base">per {biRate.period}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
}
