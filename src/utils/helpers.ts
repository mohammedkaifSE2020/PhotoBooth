
let sharedAudioCtx: AudioContext | null = null;

const getAudioCtx = () => {
  if (!sharedAudioCtx) sharedAudioCtx = new AudioContext();
  if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
  return sharedAudioCtx;
};

export function playSound(frequency: number, duration: number, volume: number) {
    const ctx = getAudioCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
}


export const playShutter = () => playSound(1200, 0.15, 0.15);
export const playBeep = () => playSound(800, 0.1, 0.1);


export function showFlash() {
    const flash = document.createElement('div');
    flash.className = 'fixed inset-0 bg-white z-50 pointer-events-none';
    flash.style.animation = 'flash 0.3s ease-out';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
};


export const processImageForSaving = (base64DataUrl: string) => {
  const base64Data = base64DataUrl.split(',')[1];
  const binaryString = window.atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
};