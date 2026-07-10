"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, Megaphone, Image as ImageIcon, PlaySquare } from "lucide-react";
import { 
  queueApi, 
  counterApi, 
  informasiApi, 
  interestApi,
  QueueItem, 
  CounterItem, 
  BiRateData, 
  InformasiPublikItem 
} from "@/lib/api";

// Extract YouTube video ID from various URL formats
function getYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function DisplayPage() {
  const [idKantor, setIdKantor] = useState<string>("01");
  const [callingQueues, setCallingQueues] = useState<QueueItem[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [counters, setCounters] = useState<CounterItem[]>([]);
  const [biRate, setBiRate] = useState<BiRateData | null>(null);
  const [informasiList, setInformasiList] = useState<InformasiPublikItem[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  // Ambil id_kantor dari query string URL saat halaman dimuat
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIdKantor(params.get("id_kantor") || "01");
    }
  }, []);

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
    if (!idKantor) return;
    try {
      const [data, countersData] = await Promise.all([
        queueApi.status(idKantor),
        counterApi.list(idKantor),
      ]);

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
      // Network error - server mungkin sedang restart, abaikan secara silent
    }
  };

  // Fetch active informasi publik
  const fetchInformasi = async () => {
    try {
      const data = await informasiApi.aktif(idKantor);
      setInformasiList(data || []);
    } catch (e) {
      console.error("Error fetching informasi publik:", e);
    }
  };

  // Fetch BI Rate
  const fetchBiRate = async () => {
    try {
      const data = await interestApi.getRate();
      setBiRate(data);
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
  }, [audioEnabled, idKantor]);

  // Pisahkan informasi bergambar/youtube untuk slideshow di kanan
  const mediaList = informasiList.filter(item => item.tipe === "gambar" || item.tipe === "youtube");
  const activeInfo = mediaList[activeSlide];

  // Auto-slideshow untuk informasi media
  useEffect(() => {
    if (mediaList.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % mediaList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [mediaList.length]);

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

  return (
    <div className="h-screen flex flex-col overflow-hidden font-sans relative select-none">

      {/* ══ PREMIUM DARK BACKGROUND ══ */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#001a1b] via-[#003436] to-[#001214]">
        {/* Ambient glow top-left */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#005E60]/30 rounded-full blur-[120px] pointer-events-none" />
        {/* Ambient glow bottom-right */}
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-[#008285]/20 rounded-full blur-[120px] pointer-events-none" />
        {/* Gold shimmer center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ffff00]/3 rounded-full blur-[200px] pointer-events-none" />
      </div>

      {/* ══ HEADER ══ */}
      <header className="relative z-10 shrink-0 bg-white/95 backdrop-blur-xl shadow-2xl border-b-4 border-[#FFFF00] h-[68px] flex items-center">
        <div className="flex justify-between items-center w-full px-8">

          {/* Logo + Title */}
          <div className="flex items-center gap-5">
            <div className="bg-white p-2 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-md">
              <img
                alt="BPR Kerta Raharja Logo"
                className="h-9 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy_PuUGIg6TcQonvnrv6ChV2tYXRE9vUggKMMgCxgxhRuXOAR7d9HS89fGozDfGiPO7VB1_XILA462zY4-y7rIBw5IZMOMqDS39L2JBtPe3M4wqKYvHrhQ2yz9GDx4h91Ej7rQhMZePA5RMX8EKLGhANiiYcCX4oUDdB8SkCXb1XitQqo69ZO5G5lkJVH12RUQfg4srNQeClopYv2Ike-yRyP-U3N1S4HA842PFSAuFRWGmig0lFIIfXDs2kOdoj01zxU"
              />
              <img
                alt="BPR Logo"
                className="h-9 w-auto object-contain border-l pl-3 border-gray-200"
                src="https://lh3.googleusercontent.com/aida/AP1WRLvrPpBEMH26EO7GTocTY_KMD1TjlLHO36PMJh-oekRfNCpqp-fBJ3mM_h0WqzDjutLaXllTzKo4eGOtWKjSQoPXrO2tu-L7gxPmuowrCMXpqaOdRr68BgvdCMdcFjFuTXyZXhPWYwcbY2I4iuPkpIK_4Jvj0DZ5Ywi4Vr_sm5nVcuM3JY3qlEdaASfvVbIbsVhM79lu-tdVFjBk1Wn5xgUSEpVu2LyAsNKSHd2Vcg4e1h5NaS_uOUtOysO2"
              />
            </div>
            <div className="border-l-2 border-gray-200 pl-5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-0.5">Sistem Informasi Antrean</p>
              <span className="font-heading font-extrabold text-xl text-[#005E60] tracking-tight leading-none">
                PT BPR Kerta Raharja
              </span>
            </div>
          </div>

          {/* Right: Live time badge + jam ops */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#e6f2f2] text-[#005E60] px-4 py-2 rounded-xl font-bold text-sm border border-[#b2e1e3]">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Senin – Jumat: 08.00 – 15.00 WIB</span>
            </div>
          </div>
        </div>
      </header>

      {/* ══ MAIN CONTENT ══ */}
      <main className="relative z-10 flex-grow flex overflow-hidden p-5 gap-5 min-h-0">

        {/* ── LEFT: Counter Cards ── */}
        <div className="flex-[3] flex flex-col gap-5 min-h-0 overflow-hidden">
          {counters.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-white/60">
              <div className="w-14 h-14 border-4 border-white/10 border-t-[#FFFF00] rounded-full animate-spin mb-5" />
              <p className="text-xl font-semibold tracking-wide">Memuat data loket...</p>
            </div>
          ) : (
            <div
              className="grid gap-5 h-full"
              style={{
                gridTemplateColumns: `repeat(${Math.min(counters.length, 2)}, minmax(0, 1fr))`,
                gridTemplateRows: counters.length > 2 ? "1fr 1fr" : "1fr",
              }}
            >
              {counters.map((c, index) => {
                const currentCalling = callingQueues.find((q) => q.counter_name === c.name);
                const shimmerDelay = `${index * 0.7}s`;

                if (currentCalling) {
                  // ── ACTIVE CARD ──
                  return (
                    <div
                      key={c.name}
                      className="rounded-[28px] overflow-hidden flex flex-col min-h-0 shadow-2xl border border-white/20"
                      style={{ boxShadow: "0 0 60px -10px rgba(0,94,96,0.6), 0 25px 50px -12px rgba(0,0,0,0.5)" }}
                    >
                      {/* Card header */}
                      <div className="bg-gradient-to-r from-[#005E60] to-[#007a7c] px-6 py-4 text-center border-b-[6px] border-[#FFFF00] relative overflow-hidden shrink-0">
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-[shimmer_3.5s_ease-in-out_infinite]"
                          style={{ animationDelay: shimmerDelay }}
                        />
                        <h2 className="text-2xl font-extrabold text-white relative z-10 font-heading tracking-wide drop-shadow-sm">
                          {c.name}
                        </h2>
                      </div>

                      {/* Card body */}
                      <div className="flex-grow flex flex-col items-center justify-center bg-white relative overflow-hidden">
                        {/* Subtle radial glow behind number */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#e6f2f2]/60 to-white pointer-events-none" />

                        {/* Status badge */}
                        <div className="absolute top-4 right-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            Melayani
                          </span>
                        </div>

                        <p className="text-[#9aacae] text-[11px] font-extrabold tracking-[0.25em] uppercase mb-3 relative z-10">
                          Nomor Antrean
                        </p>
                        <div
                          className="font-mono font-black text-[#005E60] tracking-tighter leading-none relative z-10"
                          style={{ fontSize: "clamp(64px, 10vw, 112px)" }}
                        >
                          {currentCalling.ticket_number}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // ── IDLE CARD ──
                  return (
                    <div
                      key={c.name}
                      className="rounded-[28px] overflow-hidden flex flex-col min-h-0 bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl"
                    >
                      {/* Card header kosong */}
                      <div className="bg-white/10 px-6 py-4 text-center border-b-[6px] border-white/10 shrink-0">
                        <h2 className="text-2xl font-extrabold text-white/80 font-heading tracking-wide">{c.name}</h2>
                      </div>

                      {/* Card body kosong */}
                      <div className="flex-grow flex flex-col items-center justify-center relative">
                        <div className="absolute top-4 right-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 text-white/40 border border-white/10">
                            Kosong
                          </span>
                        </div>
                        <p className="text-white/25 text-[11px] font-extrabold tracking-[0.25em] uppercase mb-3">
                          Nomor Antrean
                        </p>
                        <div
                          className="font-mono font-black text-white/15 tracking-tighter leading-none"
                          style={{ fontSize: "clamp(64px, 10vw, 112px)" }}
                        >
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

        {/* ── RIGHT: Informasi Publik Panel ── */}
        <div className="flex-[2] rounded-[28px] overflow-hidden flex flex-col min-h-0 shadow-2xl border border-white/20 bg-white/5 backdrop-blur-sm">

          {/* Panel header */}
          <div className="bg-gradient-to-r from-[#005E60] to-[#007a7c] px-6 py-4 flex items-center gap-3 shrink-0 border-b-[6px] border-[#FFFF00]">
            <div className="w-8 h-8 bg-[#FFFF00]/20 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-[#FFFF00]" />
            </div>
            <div>
              <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest leading-none">Layanan Nasabah</p>
              <span className="text-white font-extrabold text-sm tracking-wide uppercase leading-tight">Informasi BPR</span>
            </div>
          </div>

          {/* Slide content */}
          {mediaList.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-white/40 p-8 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-5">
                <ImageIcon className="w-10 h-10" />
              </div>
              <p className="font-bold text-lg text-white/50">Belum ada informasi publik</p>
              <p className="text-sm mt-2 text-white/30">Tambahkan gambar atau video di panel petugas</p>
            </div>
          ) : (
            <div className="flex-grow flex flex-col relative overflow-hidden min-h-0">
              {mediaList.map((info, idx) => (
                <div
                  key={info.id}
                  className={`absolute inset-0 flex flex-col transition-opacity duration-1000 ${idx === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                >
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

                  {/* Judul bar dengan gradient overlay */}
                  <div className="bg-gradient-to-r from-[#005E60]/95 to-[#008285]/80 backdrop-blur-sm px-5 py-3 shrink-0 flex items-center gap-2.5">
                    {info.tipe === "youtube" ? (
                      <PlaySquare className="w-4 h-4 text-red-400 flex-shrink-0" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-[#FFFF00] flex-shrink-0" />
                    )}
                    <p className="text-white font-semibold text-sm truncate">{info.judul}</p>
                  </div>
                </div>
              ))}

              {/* Slide dots */}
              {mediaList.length > 1 && (
                <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-2 z-20">
                  {mediaList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`rounded-full transition-all duration-300 ${idx === activeSlide ? "w-5 h-2.5 bg-[#FFFF00]" : "w-2.5 h-2.5 bg-white/30"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ══ MARQUEE FOOTER ══ */}
      <footer className="relative z-10 shrink-0 h-[62px] flex items-center overflow-hidden border-t-[5px] border-[#FFFF00]"
        style={{ background: "linear-gradient(90deg, #002a2b 0%, #003d3f 40%, #002a2b 100%)" }}
      >
        {/* Label kiri */}
        <div className="bg-gradient-to-br from-[#005E60] to-[#003436] text-[#FFFF00] font-extrabold text-sm h-full flex items-center px-7 shrink-0 gap-2.5 border-r-2 border-[#FFFF00]/30 min-w-[160px] justify-center tracking-widest uppercase shadow-lg">
          <Megaphone className="w-4.5 h-4.5 flex-shrink-0" />
          <span>Info BPR</span>
        </div>

        {/* Scrolling text */}
        <div className="overflow-hidden flex-grow h-full flex items-center relative">
          <div className="animate-marquee whitespace-nowrap inline-flex items-center text-[19px] font-semibold text-white/95 gap-0">
            {biRate && (
              <>
                <span className="mx-10 text-[#FFFF00]/80 text-lg">◆</span>
                <span className="inline-flex items-center gap-3">
                  <span className="bg-[#FFFF00] text-[#003436] font-black text-[11px] px-3 py-0.5 rounded-full uppercase tracking-widest">BI Rate</span>
                  <span className="font-extrabold text-[#FFFF00]">{biRate.bi_rate_str}</span>
                  <span className="text-white/50 text-base">per {biRate.period}</span>
                </span>
              </>
            )}
            {(announcements.length > 0 ? announcements : [
              "Selamat Datang di Bank BPR Kerta Raharja. Silakan ambil nomor antrean Anda.",
              "Budayakan mengantre demi ketertiban bersama di lingkungan Bank.",
            ]).map((text, idx) => (
              <span key={idx} className="inline-flex items-center">
                <span className="mx-10 text-[#FFFF00]/80 text-lg">◆</span>
                {text}
              </span>
            ))}
            {/* Seamless loop duplicate */}
            {biRate && (
              <>
                <span className="mx-10 text-[#FFFF00]/80 text-lg">◆</span>
                <span className="inline-flex items-center gap-3">
                  <span className="bg-[#FFFF00] text-[#003436] font-black text-[11px] px-3 py-0.5 rounded-full uppercase tracking-widest">BI Rate</span>
                  <span className="font-extrabold text-[#FFFF00]">{biRate.bi_rate_str}</span>
                  <span className="text-white/50 text-base">per {biRate.period}</span>
                </span>
              </>
            )}
            {(announcements.length > 0 ? announcements : [
              "Selamat Datang di Bank BPR Kerta Raharja. Silakan ambil nomor antrean Anda.",
              "Budayakan mengantre demi ketertiban bersama di lingkungan Bank.",
            ]).map((text, idx) => (
              <span key={`d-${idx}`} className="inline-flex items-center">
                <span className="mx-10 text-[#FFFF00]/80 text-lg">◆</span>
                {text}
              </span>
            ))}
          </div>
        </div>
      </footer>

      {/* ══ GLOBAL ANIMATIONS ══ */}
      <style jsx global>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 70s linear infinite;
        }
      `}</style>

    </div>
  );
}
