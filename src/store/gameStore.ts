import { useState, useCallback } from 'react';
import type { Puzzle, Action, Street } from '../poker/types';
import { generatePuzzle } from '../poker/puzzleGenerator';
import { initialStats, updateStats, accuracyPercent, type GameStats } from '../poker/scoring';

const DEV_UNLOCK_FLOP = import.meta.env.VITE_UNLOCK_FLOP === 'true';

export type TrainingPhase = 'preflop' | 'flop';
export type GamePhase = 'idle' | 'answering' | 'feedback';

export type GameState = {
  phase: GamePhase;
  trainingPhase: TrainingPhase;
  flopUnlocked: boolean;
  puzzle: Puzzle | null;
  lastAnswer: Action | null;
  wasCorrect: boolean | null;
  wasAcceptable: boolean | null;
  stats: GameStats;
};

const FLOP_UNLOCK_THRESHOLD = { minAnswered: 10, minAccuracy: 90 };

function checkFlopGate(stats: GameStats): boolean {
  return (
    DEV_UNLOCK_FLOP ||
    (stats.totalAnswered >= FLOP_UNLOCK_THRESHOLD.minAnswered &&
      accuracyPercent(stats) >= FLOP_UNLOCK_THRESHOLD.minAccuracy)
  );
}

export function useGameStore() {
  const [state, setState] = useState<GameState>({
    phase: 'idle',
    trainingPhase: DEV_UNLOCK_FLOP ? 'flop' : 'preflop',
    flopUnlocked: DEV_UNLOCK_FLOP,
    puzzle: null,
    lastAnswer: null,
    wasCorrect: null,
    wasAcceptable: null,
    stats: initialStats(),
  });

  const startGame = useCallback(() => {
    const street: Street = DEV_UNLOCK_FLOP ? 'flop' : 'preflop';
    const puzzle = generatePuzzle(street);
    setState(prev => ({
      ...prev,
      phase: 'answering',
      puzzle,
      lastAnswer: null,
      wasCorrect: null,
      wasAcceptable: null,
    }));
  }, []);

  const submitAnswer = useCallback((action: Action) => {
    setState(prev => {
      if (!prev.puzzle) return prev;
      const correct = action === prev.puzzle.correctAction;
      const acceptable = !correct && prev.puzzle.alternativeActions.includes(action);
      const newStats = updateStats(prev.stats, prev.puzzle, correct);
      const justUnlocked = !prev.flopUnlocked && checkFlopGate(newStats);
      return {
        ...prev,
        phase: 'feedback',
        lastAnswer: action,
        wasCorrect: correct,
        wasAcceptable: acceptable,
        stats: newStats,
        flopUnlocked: prev.flopUnlocked || justUnlocked,
      };
    });
  }, []);

  const nextPuzzle = useCallback(() => {
    setState(prev => {
      const nextTraining: TrainingPhase = prev.flopUnlocked ? 'flop' : 'preflop';
      const street: Street = nextTraining;
      const puzzle = generatePuzzle(street);
      return {
        ...prev,
        phase: 'answering',
        trainingPhase: nextTraining,
        puzzle,
        lastAnswer: null,
        wasCorrect: null,
        wasAcceptable: null,
      };
    });
  }, []);

  return { state, startGame, submitAnswer, nextPuzzle };
}
