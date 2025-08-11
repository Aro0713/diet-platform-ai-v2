import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { tUI, LangKey } from "@/utils/i18n";

type Slide = {
  image: string;       // /screens/xx.png
  titleKey: string;    // np. "loginBenefit1"
  descKey?: string;    // np. "lookSlide1"
};

export default function IntroOverlay({
  lang,
  videoSrcs,
  slides,
  onFinish,
  autoAdvanceMs = 4000,
}: {
  lang: LangKey;
  videoSrcs: { webm?: string; mp4?: string };
  slides: Slide[];
  onFinish: () => void;
  autoAdvanceMs?: number;
}) {
  const [step, setStep] = useState<number>(-1); // -1 = video, 0..N-1 = slides
  const prefersReducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
    []
  );

  // start od video (chyba że reduce-motion → od razu slajdy)
  useEffect(() => {
    if (prefersReducedMotion || (!videoSrcs.webm && !videoSrcs.mp4)) {
      setStep(0);
    } else {
      setStep(-1);
    }
  }, [prefersReducedMotion, videoSrcs.webm, videoSrcs.mp4]);

  // auto-przejście slajdów
  useEffect(() => {
    if (step < 0) return; // wideo steruje samo przez onEnded
    if (step >= slides.length) return;
    const t = setTimeout(() => {
      if (step === slides.length - 1) onFinish();
      else setStep(step + 1);
    }, autoAdvanceMs);
    return () => clearTimeout(t);
  }, [step, slides.length, autoAdvanceMs, onFinish]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0">
        {/* WIDEO INTRO */}
        {step === -1 && (videoSrcs.webm || videoSrcs.mp4) && (
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            onEnded={() => setStep(0)}
            onError={() => setStep(0)}
          >
            {videoSrcs.webm && <source src={videoSrcs.webm} type="video/webm" />}
            {videoSrcs.mp4 && <source src={videoSrcs.mp4} type="video/mp4" />}
          </video>
        )}

        {/* SLAJDY */}
        {step >= 0 && step < slides.length && (
  <div className="w-full h-full flex items-center justify-center p-4">
    <div className="relative grid md:grid-cols-2 gap-6 w-full max-w-5xl bg-slate-900/80 text-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="relative min-h-[260px]">
        <Image
          src={slides[step].image}
          alt=""
          fill
          sizes="(max-width: 768px) 90vw, 50vw"          // 👈 DODANE
          className="object-contain md:object-cover bg-slate-950/30"
          priority={step <= 1}
          onError={(e) => {                              // 👈 DODANE fallback
            // @ts-ignore – pozwólmy podmienić src runtime
            e.currentTarget.src = '/logo-dietcare.png';
          }}
          unoptimized                                    // opcjonalnie: wyklucza optimizer Nexta dla lokalnych plików
        />
      </div>
      <div className="p-6 md:p-10">
        <div className="flex items-start gap-3 mb-4">
          <Image
            src="/Look.png"  // 👈 upewnij się, że to dokładnie Look.png
            alt="Look"
            width={56}
            height={56}
            className="rounded-full"
            priority
          />
          <div>
            <p className="text-sm opacity-80">{tUI("lookIntroHello", lang)}</p>
            <h3 className="text-2xl font-semibold mt-1">{tUI(slides[step].titleKey as any, lang)}</h3>
          </div>
        </div>

        {slides[step].descKey && (
          <p className="opacity-90">{tUI(slides[step].descKey as any, lang)}</p>
        )}

                <div className="mt-6 flex items-center gap-2">
                  {[...Array(slides.length)].map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-2 rounded-full ${i <= step ? "bg-white" : "bg-white/30"}`}
                    />
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={onFinish}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600"
                  >
                    {tUI("lookCTASkip", lang)}
                  </button>
                  {step === slides.length - 1 && (
                    <button
                      onClick={onFinish}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    >
                      {tUI("lookCTAStart", lang)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Zamknij (X) */}
        <button
          aria-label="Close intro"
          onClick={onFinish}
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 text-white grid place-items-center text-xl"
        >
          ×
        </button>
      </div>
    </div>
  );
}
