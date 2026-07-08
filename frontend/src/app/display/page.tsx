"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, Megaphone, Volume2, VolumeX } from "lucide-react";

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

export default function DisplayPage() {
  const [callingQueues, setCallingQueues] = useState<QueueItem[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [counters, setCounters] = useState<CounterItem[]>([]);
  const [biRate, setBiRate] = useState<BiRateData | null>(null);
  
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

      // Smooth fade-out envelope
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

  // Announce the ticket number using Indonesian TTS
  const speakText = (text: string) => {
    return new Promise<void>((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }

      // Cancel any ongoing/stuck speech synthesis to prevent lag
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 1.05; // Snappy and fast speaking pace
      utterance.pitch = 1.0;

      // Select local offline voice to bypass network latency of remote Google voices
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices.find(v => v.lang.startsWith("id") && v.localService);
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith("id"));
      }
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  };

  // Trigger audio call flow
  const triggerAudioCall = async (ticket: QueueItem) => {
    if (!audioEnabled || !audioCtxRef.current) return;

    try {
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      
      // Play chime
      await playChime(audioCtx);

      // Construct vocal announcement
      const letter = ticket.prefix;
      const number = ticket.number;
      const counter = ticket.counter_name || "Loket";

      const vocalText = `Nomor antrean ${letter}, ${number}, silakan menuju ke ${counter}`;
      
      await speakText(vocalText);
    } catch (e) {
      console.error("Gagal memutar audio panggilan:", e);
    }
  };

  // Poll database status
  const fetchStatus = async () => {
    try {
      // Fetch queue status and counters list in parallel
      const [resStatus, resCounters] = await Promise.all([
        fetch("http://localhost:8000/api/queues/status"),
        fetch("http://localhost:8000/api/counters")
      ]);

      if (!resStatus.ok || !resCounters.ok) throw new Error("Gagal mengambil data dari server");
      
      const data = await resStatus.json();
      const countersData = await resCounters.json();
      
      setCallingQueues(data.calling || []);
      setAnnouncements(data.announcements || []);
      
      // Filter to only display counters that are active in the settings
      setCounters(countersData.filter((c: CounterItem) => c.is_active) || []);

      // Check if there's any active calling ticket to announce
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
      console.error("Error polling database status:", error);
    }
  };

  // Fetch BI Rate from backend (cached 6hrs server-side)
  const fetchBiRate = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/interest-rate");
      if (res.ok) {
        const data = await res.json();
        setBiRate(data);
      }
    } catch (e) {
      // Silently fail — fallback data shown from server
    }
  };

  // Start polling every 3 seconds
  useEffect(() => {
    fetchStatus();
    fetchBiRate();
    // Refresh BI Rate every 30 minutes
    const rateInterval = setInterval(fetchBiRate, 30 * 60 * 1000);
    const interval = setInterval(fetchStatus, 3000);
    return () => { clearInterval(interval); clearInterval(rateInterval); };
  }, [audioEnabled]);

  // Unlock audio context silently on first click anywhere on the page
  useEffect(() => {
    const handleUnlockClick = () => {
      if (!audioEnabled) {
        enableAudio();
      }
    };
    window.addEventListener("click", handleUnlockClick);
    return () => window.removeEventListener("click", handleUnlockClick);
  }, [audioEnabled]);

  // Activate audio context on user interaction
  const enableAudio = () => {
    setAudioEnabled(true);
    announcedRef.current = {}; // Clear to immediately trigger audio for active queues!
    
    if (typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }
        audioCtxRef.current = audioCtx;
        
        // Play silent sound to unlock browser
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
    <div className="bg-[#f8f9fa] text-[#191c1d] h-screen flex flex-col overflow-hidden font-sans relative select-none">
      
      {/* Header (Based on TopAppBar template) */}
      <header className="bg-white shadow-sm docked w-full top-0 z-10 shrink-0">
        <div className="flex justify-between items-center w-full px-16 py-4 h-[100px]">
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 p-1.5 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
              <img 
                alt="BPR Kerta Raharja Logo" 
                className="h-8 w-auto object-contain" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy_PuUGIg6TcQonvnrv6ChV2tYXRE9vUggKMMgCxgxhRuXOAR7d9HS89fGozDfGiPO7VB1_XILA462zY4-y7rIBw5IZMOMqDS39L2JBtPe3M4wqKYvHrhQ2yz9GDx4h91Ej7rQhMZePA5RMX8EKLGhANiiYcCX4oUDdB8SkCXb1XitQqo69ZO5G5lkJVH12RUQfg4srNQeClopYv2Ike-yRyP-U3N1S4HA842PFSAuFRWGmig0lFIIfXDs2kOdoj01zxU"
              />
              <img 
                alt="BPR Logo" 
                className="h-8 w-auto object-contain border-l pl-2 border-gray-200" 
                src="https://lh3.googleusercontent.com/aida/AP1WRLvrPpBEMH26EO7GTocTY_KMD1TjlLHO36PMJh-oekRfNCpqp-fBJ3mM_h0WqzDjutLaXllTzKo4eGOtWKjSQoPXrO2tu-L7gxPmuowrCMXpqaOdRr68BgvdCMdcFjFuTXyZXhPWYwcbY2I4iuPkpIK_4Jvj0DZ5Ywi4Vr_sm5nVcuM3JY3qlEdaASfvVbIbsVhM79lu-tdVFjBk1Wn5xgUSEpVu2LyAsNKSHd2Vcg4e1h5NaS_uOUtOysO2"
              />
            </div>
            <div className="text-3xl font-extrabold text-[#0099D3] tracking-tight font-heading border-l pl-3 border-gray-200">
              Display Antrean
            </div>
          </div>

          {/* Right Header Info */}
          <div className="flex items-center gap-4">
            {/* Service Hour Info */}
            <div className="flex items-center gap-2 bg-[#e6f2f2] text-[#005E60] px-4 py-1.5 rounded-xl font-bold text-xs border border-[#b2e1e3]">
              <Clock className="w-3.5 h-3.5 animate-pulse text-[#005E60]" />
              <span>Senin - Jumat: 08:00 - 15:00</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main TV Display Content Canvas */}
      <main className="flex-grow flex items-center justify-center p-6 relative w-full h-full z-0 bg-gradient-to-b from-[#f3f4f5] to-[#f8f9fa]">
        <div className="w-full max-w-[1800px] mx-auto h-full flex flex-col justify-center">
          <div className={`grid gap-6 h-[60vh] min-h-[500px]`} style={{ gridTemplateColumns: `repeat(${Math.max(counters.length, 1)}, minmax(0, 1fr))` }}>
            
            {counters.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center text-[#6b767c]">
                <div className="w-16 h-16 border-4 border-[#00638a]/20 border-t-[#00638a] rounded-full animate-spin mb-6"></div>
                <p className="text-xl font-semibold">Memuat data loket...</p>
                <p className="text-sm mt-2 opacity-60">Menghubungkan ke server antrean BPR</p>
              </div>
            )}

            {counters.map((c, index) => {
              // Find active calling ticket for this counter
              const currentCalling = callingQueues.find((q) => q.counter_name === c.name);
              const shimmerDelay = `${index * 0.5}s`;

              if (currentCalling) {
                // ACTIVE CALLING CARD
                return (
                  <div 
                    key={c.name}
                    className="bg-white rounded-xl shadow-lg flex flex-col overflow-hidden transform transition-transform hover:scale-[1.02] duration-300 border border-gray-100"
                    style={{ boxShadow: "0 10px 25px -5px rgba(0, 153, 211, 0.1), 0 8px 10px -6px rgba(0, 153, 211, 0.1)" }}
                  >
                    <div className="bg-[#00638a] py-6 px-4 text-center border-b-[8px] border-[#FFFF00] relative overflow-hidden">
                      {/* Shimmer effect inside calling card header */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"
                        style={{ animationDelay: shimmerDelay }}
                      ></div>
                      <h2 className="text-3xl font-extrabold text-white m-0 relative z-10 font-heading">
                        {c.name}
                      </h2>
                    </div>

                    <div className="flex-grow flex flex-col items-center justify-center p-8 bg-white relative">
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                          Melayani
                        </span>
                      </div>
                      <div className="text-[#6b767c] text-xs font-bold mb-2 tracking-widest uppercase">
                        Nomor Antrean
                      </div>
                      <div className="text-[120px] leading-none font-bold text-[#0099D3] tracking-tighter font-mono">
                        {currentCalling.ticket_number}
                      </div>
                    </div>
                  </div>
                );
              } else {
                // EMPTY CARD STATE (opacity-90 grayscale-[20%])
                return (
                  <div 
                    key={c.name}
                    className="bg-[#f8f9fa] rounded-xl shadow-lg flex flex-col overflow-hidden opacity-90 grayscale-[20%] border border-gray-150"
                    style={{ boxShadow: "0 10px 25px -5px rgba(0, 153, 211, 0.05)" }}
                  >
                    <div className="bg-[#00638a] py-6 px-4 text-center border-b-[8px] border-[#e1e3e4]">
                      <h2 className="text-3xl font-extrabold text-white m-0 font-heading">
                        {c.name}
                      </h2>
                    </div>

                    <div className="flex-grow flex flex-col items-center justify-center p-8 bg-[#f3f4f5] relative">
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-[#e1e3e4] text-[#3e484f] border border-[#bec8d1]">
                          Kosong
                        </span>
                      </div>
                      <div className="text-[#6b767c] text-xs font-bold mb-2 tracking-widest uppercase">
                        Nomor Antrean
                      </div>
                      <div className="text-[120px] leading-none font-bold text-[#e1e3e4] tracking-tighter font-mono">
                        ---
                      </div>
                    </div>
                  </div>
                );
              }
            })}

          </div>
        </div>
      </main>

      {/* Marquee Footer (Campaign layout) */}
      <footer className="bg-[#00638a] text-white h-[80px] shrink-0 flex items-center overflow-hidden border-t-4 border-[#FFFF00] relative z-20">
        
        {/* Fixed Info Banner Left */}
        <div className="bg-[#364146] text-[#FFFF00] font-bold text-2xl h-full flex items-center px-8 z-10 shadow-lg tracking-wide uppercase whitespace-nowrap min-w-[220px] justify-center border-r border-[#00638a]/20">
          <Megaphone className="w-6 h-6 mr-2 flex-shrink-0" />
          <span>Info BPR</span>
        </div>

        {/* Ticker Container */}
        <div className="overflow-hidden flex-grow h-full flex items-center bg-[#00638a] relative">
          <div className="animate-marquee whitespace-nowrap flex items-center text-[26px] font-semibold text-white">
            
            {/* BI Rate Realtime Section */}
            {biRate && (
              <>
                <span className="mx-6 text-[#FFFF00] text-2xl">◆</span>
                <span className="flex items-center gap-3">
                  <span className="bg-[#FFFF00] text-[#00638a] font-black text-sm px-3 py-1 rounded-full uppercase tracking-wider">BI Rate</span>
                  <span className="font-bold">{biRate.bi_rate_str}</span>
                  <span className="text-white/70 text-lg">per {biRate.period}</span>
                </span>
              </>
            )}

            {/* Announcements from DB */}
            {announcements.length > 0 ? (
              announcements.map((text, idx) => (
                <span key={idx} className="flex items-center">
                  <span className="mx-6 text-[#FFFF00] text-2xl">◆</span>
                  {text}
                </span>
              ))
            ) : (
              <>
                <span className="mx-6 text-[#FFFF00] text-2xl">◆</span>
                Selamat Datang di Bank BPR Kerta Raharja. Silakan ambil nomor antrean Anda.
                <span className="mx-6 text-[#FFFF00] text-2xl">◆</span>
                Budayakan mengantre demi ketertiban bersama di lingkungan Bank.
              </>
            )}

            {/* Duplicate for seamless scroll */}
            {biRate && (
              <>
                <span className="mx-6 text-[#FFFF00] text-2xl">◆</span>
                <span className="flex items-center gap-3">
                  <span className="bg-[#FFFF00] text-[#00638a] font-black text-sm px-3 py-1 rounded-full uppercase tracking-wider">BI Rate</span>
                  <span className="font-bold">{biRate.bi_rate_str}</span>
                  <span className="text-white/70 text-lg">per {biRate.period}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Custom Styles for Animation */}
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
          animation: marquee 20s linear infinite;
        }
      `}</style>

    </div>
  );
}
