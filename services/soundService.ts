
// Simple hosted sound effects
const SOUNDS = {
    correct: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=short-success-sound-glockenspiel-treasure-video-game-6346.mp3',
    wrong: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=wrong-answer-126515.mp3',
    complete: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3',
    click: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_df397c2321.mp3?filename=ui-click-43196.mp3',
    achievement: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_924254881d.mp3?filename=level-up-sounds-6946.mp3'
};

class SoundService {
    private audioCache: Record<string, HTMLAudioElement> = {};
    private enabled: boolean = true;

    constructor() {
        // Preload sounds
        if (typeof window !== 'undefined') {
            Object.entries(SOUNDS).forEach(([key, url]) => {
                this.audioCache[key] = new Audio(url);
                this.audioCache[key].volume = 0.4;
            });
        }
    }

    play(type: keyof typeof SOUNDS) {
        if (!this.enabled) return;
        const audio = this.audioCache[type];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.debug("Audio play blocked", e));
        }
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }
}

export const sfx = new SoundService();
