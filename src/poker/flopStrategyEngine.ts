import type {
  Action, FlopDecisionInput, FlopSolution,
  MadeHandCategory, DrawCategory, BoardTexture,
  OpponentFlopAction, MistakeTag, Confidence,
} from './types';
import { classifyBoardTexture } from './boardTexture';
import { classifyMadeHand } from './madeHandClassifier';
import { classifyDraw } from './drawClassifier';
import { buildFlopExplanation } from './flopExplanationEngine';

type Ctx = FlopDecisionInput & {
  madeHand: MadeHandCategory;
  draw: DrawCategory;
  board: BoardTexture;
};

function isFacingAggression(ctx: Ctx): boolean {
  return ctx.opponentFlopAction === 'raises-hero-bet' || ctx.opponentFlopAction === 'check-raises';
}

function isStrongDraw(draw: DrawCategory): boolean {
  return draw === 'combo-draw' || draw === 'nut-flush-draw' || draw === 'flush-draw' || draw === 'open-ended-straight-draw';
}

function isOpponentBet(action: OpponentFlopAction): boolean {
  return action === 'bets-small' || action === 'bets-half-pot' || action === 'bets-big';
}

function isGoodCBetSpot(ctx: Ctx): boolean {
  return (
    ctx.preflopRole === 'preflop-raiser' &&
    ctx.opponentFlopAction === 'checks-to-hero' &&
    (ctx.board === 'dry') &&
    ctx.potType === 'heads-up' &&
    ctx.opponentType !== 'calling-station' &&
    ctx.opponentType !== 'maniac'
  );
}

function sizingForBet(board: BoardTexture): string {
  if (board === 'wet' || board === 'very-wet') return '65–75% pot';
  return '45–55% pot';
}

type Result = { action: Action; acceptable: Action[]; tags: string[]; sizing: string | null };

function solveMonster(ctx: Ctx): Result {
  if (ctx.opponentFlopAction === 'checks-to-hero') {
    const sizing = ctx.board === 'wet' || ctx.board === 'very-wet' ? '65–80% pot' : '50–65% pot';
    if (ctx.board === 'wet' || ctx.board === 'very-wet') {
      return { action: 'Bet Big', acceptable: [], tags: ['value-bet', 'charge-draws'], sizing };
    }
    if (ctx.opponentType === 'calling-station' || ctx.opponentType === 'loose-passive') {
      return { action: 'Bet Big', acceptable: ['Bet Medium'], tags: ['value-bet', 'value-bet-calling-station'], sizing };
    }
    return { action: 'Bet Medium', acceptable: ['Bet Big'], tags: ['value-bet'], sizing: '50–65% pot' };
  }
  if (isOpponentBet(ctx.opponentFlopAction)) {
    if (ctx.opponentType === 'maniac') {
      return { action: 'Call', acceptable: ['Raise'], tags: ['let-maniac-bluff'], sizing: null };
    }
    return { action: 'Raise', acceptable: ['Call'], tags: ['value-bet'], sizing: '2.5–3× the bet' };
  }
  if (isFacingAggression(ctx)) {
    return { action: 'Raise', acceptable: ['Call'], tags: ['value-bet', 'monster'], sizing: 'Re-raise to 3× or jam' };
  }
  return { action: 'Bet Medium', acceptable: [], tags: ['value-bet'], sizing: sizingForBet(ctx.board) };
}

function solveStrongMadeHand(ctx: Ctx): Result {
  if (ctx.opponentFlopAction === 'checks-to-hero') {
    return { action: 'Bet Medium', acceptable: ['Bet Small'], tags: ['value-bet'], sizing: sizingForBet(ctx.board) };
  }
  if (ctx.opponentFlopAction === 'bets-small' || ctx.opponentFlopAction === 'bets-half-pot') {
    if (ctx.opponentType === 'maniac') {
      return { action: 'Call', acceptable: ['Raise'], tags: ['let-maniac-bluff'], sizing: null };
    }
    return { action: 'Call', acceptable: [], tags: ['value-bet', 'reasonable-price'], sizing: null };
  }
  if (ctx.opponentFlopAction === 'bets-big') {
    if (ctx.board === 'dry' && ctx.opponentType !== 'tight') {
      return { action: 'Call', acceptable: [], tags: ['value-bet', 'dry-board'], sizing: null };
    }
    return { action: 'Fold', acceptable: ['Call'], tags: ['big-bet-pressure'], sizing: null };
  }
  if (isFacingAggression(ctx)) {
    if (ctx.opponentType === 'loose-passive' || ctx.opponentType === 'calling-station') {
      return { action: 'Fold', acceptable: [], tags: ['respect-passive-aggression'], sizing: null };
    }
    return { action: 'Fold', acceptable: ['Call'], tags: ['one-pair-facing-raise'], sizing: null };
  }
  return { action: 'Bet Medium', acceptable: [], tags: ['value-bet'], sizing: sizingForBet(ctx.board) };
}

function solveMediumMadeHand(ctx: Ctx): Result {
  if (ctx.opponentFlopAction === 'checks-to-hero') {
    if (ctx.opponentType === 'calling-station' && ctx.board === 'dry') {
      return { action: 'Bet Small', acceptable: ['Check'], tags: ['thin-value'], sizing: '25–33% pot' };
    }
    return { action: 'Check', acceptable: [], tags: ['pot-control'], sizing: null };
  }
  if (ctx.opponentFlopAction === 'bets-small') {
    return { action: 'Call', acceptable: ['Fold'], tags: ['pot-control', 'small-price'], sizing: null };
  }
  if (ctx.opponentFlopAction === 'bets-half-pot') {
    if (ctx.isHeroInPosition && (ctx.board === 'dry' || ctx.board === 'semi-wet')) {
      return { action: 'Call', acceptable: ['Fold'], tags: ['pot-control', 'position'], sizing: null };
    }
    return { action: 'Fold', acceptable: [], tags: ['pot-control', 'avoid-big-pot'], sizing: null };
  }
  if (ctx.opponentFlopAction === 'bets-big') {
    return { action: 'Fold', acceptable: [], tags: ['pot-control', 'big-bet-pressure'], sizing: null };
  }
  if (isFacingAggression(ctx)) {
    if (ctx.opponentType === 'loose-passive' || ctx.opponentType === 'calling-station') {
      return { action: 'Fold', acceptable: [], tags: ['respect-passive-aggression', 'do-not-marry-one-pair'], sizing: null };
    }
    return { action: 'Fold', acceptable: [], tags: ['do-not-marry-one-pair'], sizing: null };
  }
  return { action: 'Check', acceptable: [], tags: ['pot-control'], sizing: null };
}

function solveStrongDraw(ctx: Ctx): Result {
  if (ctx.opponentFlopAction === 'checks-to-hero') {
    if (ctx.opponentType === 'calling-station') {
      return { action: 'Check', acceptable: [], tags: ['strong-draw', 'low-fold-equity'], sizing: null };
    }
    if (ctx.isHeroInPosition) {
      return { action: 'Bet Medium', acceptable: ['Check'], tags: ['semi-bluff', 'position'], sizing: '40–55% pot' };
    }
    return { action: 'Check', acceptable: [], tags: ['strong-draw', 'out-of-position'], sizing: null };
  }
  if (ctx.opponentFlopAction === 'bets-small' || ctx.opponentFlopAction === 'bets-half-pot') {
    if (ctx.draw === 'combo-draw' && ctx.opponentType !== 'calling-station') {
      return { action: 'Raise', acceptable: ['Call'], tags: ['combo-draw', 'semi-bluff'], sizing: '2.5–3× the bet' };
    }
    return { action: 'Call', acceptable: [], tags: ['strong-draw', 'continue-draw', 'reasonable-price'], sizing: null };
  }
  if (ctx.opponentFlopAction === 'bets-big') {
    if (ctx.draw === 'combo-draw') {
      return { action: 'Call', acceptable: ['Raise'], tags: ['combo-draw', 'strong-draw', 'continue-draw'], sizing: null };
    }
    if (ctx.draw === 'nut-flush-draw' && ctx.isHeroInPosition) {
      return { action: 'Call', acceptable: [], tags: ['nut-flush-draw', 'continue-draw'], sizing: null };
    }
    return { action: 'Fold', acceptable: ['Call'], tags: ['draw', 'bad-price'], sizing: null };
  }
  if (isFacingAggression(ctx)) {
    if (ctx.draw === 'combo-draw') {
      return { action: 'Call', acceptable: ['Raise'], tags: ['combo-draw', 'strong-draw'], sizing: null };
    }
    return { action: 'Fold', acceptable: [], tags: ['draw', 'fold-to-aggression'], sizing: null };
  }
  return { action: 'Check', acceptable: [], tags: ['strong-draw'], sizing: null };
}

function solveCBet(ctx: Ctx): Result {
  if (ctx.opponentType === 'tight') {
    return { action: 'Bet Small', acceptable: [], tags: ['c-bet', 'fold-equity', 'range-advantage'], sizing: '25–35% pot' };
  }
  return { action: 'Bet Small', acceptable: ['Check'], tags: ['c-bet', 'range-advantage', 'dry-board'], sizing: '25–35% pot' };
}

function solveWeakMissed(ctx: Ctx): Result {
  if (ctx.opponentFlopAction === 'checks-to-hero') {
    if (ctx.opponentType === 'calling-station') {
      return { action: 'Check', acceptable: [], tags: ['missed-hand', 'do-not-bluff-calling-station'], sizing: null };
    }
    if (isGoodCBetSpot(ctx)) {
      return { action: 'Bet Small', acceptable: ['Check'], tags: ['c-bet', 'missed-hand'], sizing: '25–35% pot' };
    }
    return { action: 'Check', acceptable: [], tags: ['missed-hand', 'give-up'], sizing: null };
  }
  if (ctx.opponentFlopAction === 'bets-small' && ctx.draw === 'gutshot' && ctx.isHeroInPosition) {
    return { action: 'Fold', acceptable: ['Call'], tags: ['fold-weak-draw', 'bad-price'], sizing: null };
  }
  return { action: 'Fold', acceptable: [], tags: ['missed-hand', 'fold-to-pressure', 'fold-weak-draw'], sizing: null };
}

function computeDifficulty(ctx: Ctx, tags: string[]): 1 | 2 | 3 | 4 | 5 {
  if (ctx.opponentType !== 'unknown') return 4;
  if (tags.includes('do-not-marry-one-pair') || tags.includes('respect-passive-aggression')) return 3;
  if (tags.includes('let-maniac-bluff')) return 4;
  if (ctx.madeHand === 'monster') return 1;
  if (ctx.madeHand === 'no-made-hand' && tags.includes('do-not-bluff-calling-station')) return 2;
  if (tags.includes('c-bet')) return 3;
  if (isStrongDraw(ctx.draw)) return 3;
  if (ctx.madeHand === 'medium-made-hand' && tags.includes('pot-control')) return 2;
  if (ctx.madeHand === 'strong-made-hand') return 2;
  return 2;
}

function computeMistakeTag(tags: string[], madeHand: MadeHandCategory): MistakeTag | null {
  if (tags.includes('do-not-bluff-calling-station')) return 'bluffed-calling-station';
  if (tags.includes('do-not-marry-one-pair')) return 'married-one-pair';
  if (tags.includes('respect-passive-aggression')) return 'ignored-passive-aggression';
  if (tags.includes('fold-weak-draw') || tags.includes('fold-to-pressure')) return 'chased-weak-draw';
  if (tags.includes('missed-value-bet') || (tags.includes('value-bet') && madeHand !== 'no-made-hand')) return 'missed-value-bet';
  if (tags.includes('pot-control') && madeHand === 'medium-made-hand') return 'overplayed-weak-top-pair';
  return null;
}

function computeConfidence(action: Action, tags: string[]): Confidence {
  if (tags.some(t => t.includes('borderline')) || (tags.includes('pot-control') && action === 'Fold')) return 'borderline';
  if (tags.includes('one-pair-facing-raise') || tags.includes('big-bet-pressure')) return 'borderline';
  return 'clear';
}

export function solveFlopPuzzle(input: FlopDecisionInput): FlopSolution {
  const madeHand = classifyMadeHand(input.heroCards, input.flop);
  const draw = classifyDraw(input.heroCards, input.flop);
  const board = classifyBoardTexture(input.flop);
  const ctx: Ctx = { ...input, madeHand, draw, board };

  let result: Result;

  if (isFacingAggression(ctx) && (madeHand === 'medium-made-hand' || madeHand === 'weak-made-hand' || madeHand === 'no-made-hand')) {
    result = {
      action: 'Fold',
      acceptable: [],
      tags: ['do-not-marry-one-pair', 'fold-to-aggression'],
      sizing: null,
    };
  } else if (madeHand === 'monster') {
    result = solveMonster(ctx);
  } else if (madeHand === 'strong-made-hand') {
    result = solveStrongMadeHand(ctx);
  } else if (isStrongDraw(draw)) {
    result = solveStrongDraw(ctx);
  } else if (madeHand === 'medium-made-hand') {
    result = solveMediumMadeHand(ctx);
  } else if (isGoodCBetSpot(ctx)) {
    result = solveCBet(ctx);
  } else {
    result = solveWeakMissed(ctx);
  }

  const difficulty = computeDifficulty(ctx, result.tags);
  const mistakeTag = computeMistakeTag(result.tags, madeHand);
  const confidence = computeConfidence(result.action, result.tags);
  const explanation = buildFlopExplanation({
    bestAction: result.action,
    tags: result.tags,
    madeHand,
    draw,
    board,
    opponentType: input.opponentType,
    opponentFlopAction: input.opponentFlopAction,
    preflopRole: input.preflopRole,
    isHeroInPosition: input.isHeroInPosition,
  });

  return {
    bestAction: result.action,
    acceptableActions: result.acceptable,
    madeHandCategory: madeHand,
    drawCategory: draw,
    boardTexture: board,
    recommendedSizing: result.sizing,
    confidence,
    explanation,
    tags: result.tags,
    difficulty,
    mistakeTag,
  };
}
