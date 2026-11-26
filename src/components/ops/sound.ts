"use client";

/* WebAudio sound cues for the ops boards — tiny oscillator beeps, no audio files. */

let ctx: AudioContext | null = null;
let muted = false;

type Cue = "request" | "order" | "done" | "error";

const FREQ: Record<Cue, [number, number]> = {
  request: [880, 1175], // two rising pings — table request
  order: [660, 880], // new ticket
  done: [520, 392], // falling — completed
  error: [220, 196], // low buzz
};

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function setBoardMuted(v: boolean): void {
  muted = v;
  for (const l of muteListeners) l();
}

const muteListeners = new Set<() => void>();

export function subscribeMute(cb: () => void): () => void {
  muteListeners.add(cb);
  return () => {
    muteListeners.delete(cb);
  };
}

export function isBoardMuted(): boolean {
  return muted;
}

export function beep(cue: Cue = "order"): void {
  if (muted) return;
  const ac = getCtx();
  if (!ac) return;
  try {
    const [f1, f2] = FREQ[cue];
    const now = ac.currentTime;
    for (const [i, f] of [f1, f2].entries()) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = cue === "error" ? "sawtooth" : "sine";
      o.frequency.value = f;
      o.connect(g);
      g.connect(ac.destination);
      const t0 = now + i * 0.16;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.start(t0);
      o.stop(t0 + 0.25);
    }
  } catch {
    /* audio unavailable */
  }
}
