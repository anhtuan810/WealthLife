import { create } from 'zustand';
import type { ArchetypeId } from '../game/archetypes';
import { createPlayer, type Player } from '../game/player';
import { tick } from '../game/tick';

type GameState = {
  selectedId: ArchetypeId | null;
  player: Player | null;
  freedomPulse: number;

  selectArchetype: (id: ArchetypeId) => void;
  startGame: () => void;
  resetSelection: () => void;
  nextMonth: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  selectedId: null,
  player: null,
  freedomPulse: 0,

  selectArchetype: (id) => set({ selectedId: id }),

  startGame: () => {
    const id = get().selectedId;
    if (!id) return;
    set({ player: createPlayer(id) });
  },

  resetSelection: () => set({ selectedId: null, player: null }),

  // Run one deterministic monthly tick and pulse the freedom meter.
  nextMonth: () =>
    set((s) =>
      s.player
        ? {
            player: tick(s.player),
            freedomPulse: s.freedomPulse + 1,
          }
        : s,
    ),
}));
