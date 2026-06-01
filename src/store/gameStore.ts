import { useState, useCallback } from 'react';
import type { Puzzle, Action } from '../poker/types';
import { generatePuzzle } from '../poker/puzzleGenerator';
import { initialStats, updateStats, type GameStats } from '../poker/scoring';

export type GamePhase = 'idle' | 'answering' | 'feedback';

export type GameState = {
  phase: GamePhase;
  puzzle: Puzzle | null;
  lastAnswer: Action | null;
  wasCorrect: boolean | null;
  wasAcceptable: boolean | null; // borderline spot where player chose an alternative action
  stats: GameStats;
};

export function useGameStore() {
  const [state, setState] = useState<GameState>({
    phase: 'idle',
    puzzle: null,
    lastAnswer: null,
    wasCorrect: null,
    wasAcceptable: null,
    stats: initialStats(),
  });

  const startGame = useCallback(() => {
    const puzzle = generatePuzzle('preflop');
    setState(prev => ({
      ...prev,
      phase: 'answering',
      puzzle,
      lastAnswer: null,
      wasCorrect: null,
    }));
  }, []);

  const submitAnswer = useCallback((action: Action) => {
    setState(prev => {
      if (!prev.puzzle) return prev;
      const correct = action === prev.puzzle.correctAction;
      const acceptable = !correct && prev.puzzle.alternativeActions.includes(action);
      const newStats = updateStats(prev.stats, prev.puzzle, correct);
      return {
        ...prev,
        phase: 'feedback',
        lastAnswer: action,
        wasCorrect: correct,
        wasAcceptable: acceptable,
        stats: newStats,
      };
    });
  }, []);

  const nextPuzzle = useCallback(() => {
    const puzzle = generatePuzzle('preflop');
    setState(prev => ({
      ...prev,
      phase: 'answering',
      puzzle,
      lastAnswer: null,
      wasCorrect: null,
      wasAcceptable: null,
    }));
  }, []);

  return { state, startGame, submitAnswer, nextPuzzle };
}
