import { useCallback } from 'react';

const SOUNDS = {
    join: '/sounds/jump.mp3',
    response: '/sounds/jump.mp3',
    treasure: '/sounds/treasure.mp3',
    vine: '/sounds/vine.mp3',
    damage: '/sounds/damage.mp3',
    death: '/sounds/death.mp3',
    phaseTransition: '/sounds/vine.mp3',
};

export const useSoundEffects = () => {
    const play = useCallback((soundKey, options = {}) => {
        const soundPath = SOUNDS[soundKey];
        if (!soundPath) {
            console.warn(`Sound effect "${soundKey}" not found`);
            return;
        }

        try {
            const audio = new Audio(soundPath);
            audio.volume = options.volume || 0.7;
            audio.play().catch(err => {
                // Silently fail if audio can't play (e.g., browser autoplay restrictions)
                console.debug('Audio playback failed:', err.message);
            });
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }, []);

    return {
        play,
        playJoin: () => play('join'),
        playResponse: () => play('response'),
        playTreasure: () => play('treasure'),
        playVine: () => play('vine'),
        playDamage: () => play('damage'),
        playDeath: () => play('death'),
        playPhaseTransition: () => play('phaseTransition'),
    };
};
