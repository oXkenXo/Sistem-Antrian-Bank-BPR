"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, Megaphone, Image as ImageIcon, PlaySquare } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
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

  const lastDataRef = useRef<string>("");

  // Poll queue status + counters
  const fetchStatus = async () => {
    if (!idKantor) return;
    try {
      const data = await queueApi.status(idKantor);

      const currentDataStr = JSON.stringify({ calling: data.calling, announcements: data.announcements, counters: data.counters, stats: data.stats });
      if (lastDataRef.current === currentDataStr) return;
      lastDataRef.current = currentDataStr;

      setCallingQueues(data.calling || []);
      setAnnouncements(data.announcements || []);
      setCounters(data.counters || []);

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
    const statusInterval = setInterval(fetchStatus, 2500);
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

      {/* ══ PREMIUM BRIGHT GREEN BACKGROUND ══ */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#008285] via-[#005E60] to-[#00383a]">
        <div className="absolute -top-[500px] -left-[500px] w-[1000px] h-[1000px] bg-white/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-[500px] -right-[500px] w-[1000px] h-[1000px] bg-[#FFFF00]/15 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* ══ HEADER ══ */}
      <header className="relative z-10 shrink-0 bg-white shadow-[0_2px_20px_rgb(0,0,0,0.04)] border-b border-gray-100 h-[80px] flex items-center">
        <div className="flex justify-between items-center w-full px-8">

          {/* Logo + Title */}
          <div className="flex items-center gap-5">
            <div className="bg-white p-2 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-md">
              <BrandLogo />
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
            <div className="flex flex-col gap-3 h-full">
              {counters.map((c, index) => {
                const currentCalling = callingQueues.find((q) => q.counter_name === c.name);
                
                if (currentCalling) {
                  // ── ACTIVE HORIZONTAL CARD ──
                  return (
                    <div
                      key={c.name}
                      className="flex-1 min-h-0 bg-white shadow-xl rounded-[20px] flex items-center px-6 overflow-hidden relative border border-gray-100"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#005E60]" />
                      
                      <div className="flex-1 flex items-center pl-4">
                        <span className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse mr-5 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-800 font-heading tracking-wide">
                          {c.name}
                        </h2>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0 whitespace-nowrap">
                        <span className="text-gray-400 text-sm font-extrabold tracking-[0.2em] uppercase">
                          Nomor
                        </span>
                        <div
                          className="font-mono font-black text-[#005E60] tracking-tighter"
                          style={{ fontSize: "clamp(30px, min(5vw, 9vh), 80px)", lineHeight: 1.1 }}
                        >
                          {currentCalling.ticket_number}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // ── IDLE HORIZONTAL CARD ──
                  return (
                    <div
                      key={c.name}
                      className="flex-1 min-h-0 bg-white/10 backdrop-blur-sm rounded-[20px] border border-white/10 flex items-center px-6"
                    >
                      <div className="flex-1 flex items-center pl-7 opacity-70">
                        <span className="w-3 h-3 rounded-full bg-white/20 mr-5" />
                        <h2 className="text-2xl lg:text-3xl font-extrabold text-white font-heading tracking-wide">
                          {c.name}
                        </h2>
                      </div>
                      
                      <div className="flex items-center gap-4 opacity-40 shrink-0 whitespace-nowrap">
                        <span className="text-white text-xs font-bold tracking-[0.2em] uppercase">
                          Kosong
                        </span>
                        <div
                          className="font-mono font-black text-white tracking-tighter"
                          style={{ fontSize: "clamp(30px, min(5vw, 9vh), 80px)", lineHeight: 1.1 }}
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
        <div className="flex-[2] rounded-3xl overflow-hidden flex flex-col min-h-0 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 bg-white relative">

          {/* Panel header */}
          <div className="bg-[#005E60] px-6 py-4 flex items-center gap-4 shrink-0 border-b-4 border-[#FFFF00]">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-teal-100 font-bold uppercase tracking-widest leading-none mb-1">Layanan Nasabah</p>
              <span className="text-white font-extrabold text-lg tracking-wide uppercase leading-tight">Informasi BPR</span>
            </div>
          </div>

          {/* Slide content */}
          {mediaList.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-5 shadow-sm border border-gray-100">
                <ImageIcon className="w-10 h-10 text-gray-300" />
              </div>
              <p className="font-bold text-lg text-gray-500">Belum ada informasi publik</p>
              <p className="text-sm mt-2 text-gray-400">Tambahkan gambar atau video di panel petugas</p>
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
      <footer className="relative z-10 shrink-0 h-[62px] flex items-center overflow-hidden border-t border-gray-200 bg-white"
      >
        {/* Label kiri */}
        <div className="bg-gradient-to-r from-[#005E60] to-[#008285] text-white font-extrabold text-sm h-full flex items-center px-7 shrink-0 gap-2.5 border-r-4 border-[#FFFF00] min-w-[160px] justify-center tracking-widest uppercase shadow-md relative z-10">
          <Megaphone className="w-5 h-5 flex-shrink-0 text-[#FFFF00]" />
          <span>Info BPR</span>
        </div>

        {/* Scrolling text */}
        <div className="overflow-hidden flex-grow h-full flex items-center relative bg-gray-50/50">
          <div className="animate-marquee whitespace-nowrap inline-flex items-center text-[19px] font-semibold text-gray-700 gap-0">
            {biRate && (
              <>
                <span className="mx-10 text-[#005E60]/30 text-lg">◆</span>
                <span className="inline-flex items-center gap-3">
                  <span className="bg-[#005E60] text-white font-black text-[11px] px-3 py-0.5 rounded-full uppercase tracking-widest">BI Rate</span>
                  <span className="font-extrabold text-[#005E60]">{biRate.bi_rate_str}</span>
                  <span className="text-gray-400 text-base">per {biRate.period}</span>
                </span>
              </>
            )}
            {(announcements.length > 0 ? announcements : [
              "Selamat Datang di Bank BPR Kerta Raharja. Silakan ambil nomor antrean Anda.",
              "Budayakan mengantre demi ketertiban bersama di lingkungan Bank.",
            ]).map((text, idx) => (
              <span key={idx} className="inline-flex items-center">
                <span className="mx-10 text-[#005E60]/30 text-lg">◆</span>
                {text}
              </span>
            ))}
            {/* Seamless loop duplicate */}
            {biRate && (
              <>
                <span className="mx-10 text-[#005E60]/30 text-lg">◆</span>
                <span className="inline-flex items-center gap-3">
                  <span className="bg-[#005E60] text-white font-black text-[11px] px-3 py-0.5 rounded-full uppercase tracking-widest">BI Rate</span>
                  <span className="font-extrabold text-[#005E60]">{biRate.bi_rate_str}</span>
                  <span className="text-gray-400 text-base">per {biRate.period}</span>
                </span>
              </>
            )}
            {(announcements.length > 0 ? announcements : [
              "Selamat Datang di Bank BPR Kerta Raharja. Silakan ambil nomor antrean Anda.",
              "Budayakan mengantre demi ketertiban bersama di lingkungan Bank.",
            ]).map((text, idx) => (
              <span key={`d-${idx}`} className="inline-flex items-center">
                <span className="mx-10 text-[#005E60]/30 text-lg">◆</span>
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
