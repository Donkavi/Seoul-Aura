"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, Pause, Volume2, VolumeX, ArrowRight, Maximize2 } from "lucide-react";

const FALLBACK_VIDEOS = [
  "/videos/skincare-ritual.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-young-woman-applying-cream-to-her-face-while-looking-43947-large.mp4",
];

const FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1920&h=1080&fit=crop&q=80";

interface VSConfig {
  videoUrl: string;
  posterUrl: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  cta1Label: string;
  cta1Href: string;
  cta2Label: string;
  cta2Href: string;
}

const DEFAULT_CONFIG: VSConfig = {
  videoUrl: "",
  posterUrl: "",
  badge: "The Seoul Aura Ritual",
  title: "Skincare is a",
  highlight: "love language.",
  description: "Slow mornings, glass skin, and the quiet luxury of authentic Korean rituals — now within reach.",
  cta1Label: "Shop The Ritual",
  cta1Href: "/shop?origin=Korea",
  cta2Label: "Discover Subscriptions",
  cta2Href: "/subscriptions",
};

export default function VideoShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [config, setConfig] = useState<VSConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.videoShowcase) {
          setConfig({ ...DEFAULT_CONFIG, ...data.videoShowcase });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setPlaying(true);
        } else {
          video.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) video.requestFullscreen();
  };

  const poster = config.posterUrl || FALLBACK_POSTER;
  const videoSources = config.videoUrl ? [config.videoUrl] : FALLBACK_VIDEOS;

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-ink-900"
    >
      {videoFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt="Seoul Aura showcase"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
          poster={poster}
        >
          {videoSources.map((src) => (
            <source key={src} src={src} type="video/mp4" />
          ))}
        </video>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-ink-900/40 via-ink-900/20 to-ink-900/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-900/60 via-transparent to-transparent" />

      <div className="relative h-full max-w-7xl mx-auto px-4 lg:px-12 flex flex-col justify-end pb-32 lg:pb-40">
        <div className="max-w-2xl space-y-6 animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse-soft" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-white font-semibold">
              {config.badge}
            </span>
          </div>

          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium text-white leading-[1.05] tracking-tight">
            {config.title}
            <span className="block italic text-rose-300">{config.highlight}</span>
          </h2>

          <p className="text-base lg:text-lg text-white/85 max-w-md leading-relaxed">
            {config.description}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={config.cta1Href}
              className="bg-white text-ink-900 hover:bg-rose-50 px-7 py-3.5 text-sm font-medium tracking-wide transition-all duration-300 inline-flex items-center gap-2 group"
            >
              {config.cta1Label}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            {config.cta2Label && (
              <Link
                href={config.cta2Href}
                className="border border-white/40 text-white hover:bg-white hover:text-ink-900 px-7 py-3.5 text-sm font-medium tracking-wide transition-all duration-300 backdrop-blur"
              >
                {config.cta2Label}
              </Link>
            )}
          </div>
        </div>
      </div>

      {!videoFailed && (
        <div className="absolute bottom-8 lg:bottom-10 right-4 lg:right-12 flex items-center gap-2 z-10">
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause video" : "Play video"}
            className="w-11 h-11 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white transition-all"
          >
            {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <button
            onClick={toggleMute}
            aria-label={muted ? "Unmute video" : "Mute video"}
            className="w-11 h-11 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white transition-all"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={handleFullscreen}
            aria-label="Fullscreen"
            className="w-11 h-11 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full hidden sm:flex items-center justify-center text-white transition-all"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      )}

      <div className="absolute bottom-8 left-4 lg:left-12 flex items-center gap-3 text-white/70 text-[10px] uppercase tracking-[0.3em] font-semibold z-10">
        <span className="w-8 h-px bg-white/40" />
        Scroll
      </div>
    </section>
  );
}
