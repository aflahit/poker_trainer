import type { Action, DecisionInput, Solution, Street } from './types';
import { isInOpeningRange } from './openingRanges';
import {
  isSmallPair,
  isStrongIsolationHand,
  isSpeculativeHand,
  isGoodSpeculativeHand,
  isVeryStrongHand,
  isBigBlindDefenseHand,
  isReasonableContinueHand,
} from './handClassifier';
import { buildExplanation } from './explanationEngine';

// Street-based dispatch — post-flop solvers plug in here
export function solve(street: Street, input: DecisionInput): Solution {
  switch (street) {
    case 'preflop':
      return solvePreflop(input);
    case 'flop':
    case 'turn':
    case 'river':
      // Post-flop solvers will be implemented here
      throw new Error(`${street} solver not yet implemented`);
  }
}

function solvePreflop(input: DecisionInput): Solution {
  const { handCode, handClass, positionClass, actionContext, stackDepth, opponentType } = input;

  let action: Action;
  const tags: string[] = [];

  if (actionContext === 'three-bet-before-hero') {
    if (['AA', 'KK', 'QQ', 'AKs', 'AKo'].includes(handCode)) {
      action = 'Re-raise';
      tags.push('premium-hand', 'three-bet-discipline');
    } else if (['JJ', 'AQs'].includes(handCode) && stackDepth !== 'short') {
      action = 'Call';
      tags.push('three-bet-discipline');
    } else {
      action = 'Fold';
      tags.push('three-bet-discipline');
    }
  } else if (actionContext === 'folded-to-hero') {
    if (isInOpeningRange(handCode, positionClass)) {
      action = 'Raise';
      tags.push(positionClass === 'late' ? 'late-position-steal' : 'raise-for-value');
      if (handClass === 'premium') tags.push('premium-hand');
    } else {
      action = 'Fold';
      if (handClass === 'trap') tags.push('dominated-hand');
      if (handClass === 'speculative' && (positionClass === 'early' || positionClass === 'middle')) {
        tags.push('early-position-tight');
      }
    }
  } else if (actionContext === 'one-limper') {
    if (isStrongIsolationHand(handCode)) {
      action = 'Raise';
      tags.push('raise-for-value');
      if (opponentType === 'loose-passive' || opponentType === 'calling-station') {
        tags.push('calling-station-value');
      }
    } else if (positionClass === 'late' && stackDepth === 'deep' && isSpeculativeHand(handCode)) {
      action = 'Call';
      tags.push('small-pair-set-mine', 'position-advantage');
    } else {
      action = 'Fold';
      if (handClass === 'trap') tags.push('dominated-hand');
    }
  } else if (actionContext === 'multiple-limpers') {
    if (isVeryStrongHand(handCode)) {
      action = 'Raise';
      tags.push('raise-for-value', 'premium-hand');
    } else if (
      (positionClass === 'late' || positionClass === 'big-blind') &&
      stackDepth === 'deep' &&
      isSpeculativeHand(handCode)
    ) {
      action = 'Call';
      tags.push('small-pair-set-mine', 'multiway-implied-odds');
    } else {
      action = 'Fold';
    }
  } else if (actionContext === 'early-raise') {
    const tighterOpponent = opponentType === 'tight';
    // TT from late position with deep stacks can call even a tight raise — position + implied odds justify it
    const ttLateDeep = handCode === 'TT' && positionClass === 'late' && stackDepth === 'deep';
    if (['AA', 'KK', 'QQ', 'AKs', 'AKo'].includes(handCode)) {
      action = 'Re-raise';
      tags.push('premium-hand', 'raise-for-value');
    } else if (['JJ', 'TT', 'AQs'].includes(handCode) && (!tighterOpponent || ttLateDeep)) {
      action = 'Call';
      tags.push('respect-tight-raise');
    } else if (stackDepth === 'deep' && isSmallPair(handCode)) {
      action = 'Call';
      tags.push('small-pair-set-mine');
    } else {
      action = 'Fold';
      tags.push('respect-tight-raise');
      if (handClass === 'trap') tags.push('dominated-hand');
    }
  } else if (actionContext === 'middle-raise') {
    if (['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'].includes(handCode)) {
      action = 'Re-raise';
      tags.push('premium-hand', 'raise-for-value');
    } else if (['TT', '99', 'AQs', 'AQo', 'AJs', 'KQs'].includes(handCode)) {
      action = 'Call';
    } else if (positionClass === 'late' && stackDepth === 'deep' && isGoodSpeculativeHand(handCode)) {
      action = 'Call';
      tags.push('position-advantage', 'multiway-implied-odds');
    } else {
      action = 'Fold';
      if (handClass === 'trap') tags.push('dominated-hand');
    }
  } else if (actionContext === 'late-raise') {
    if (['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs'].includes(handCode)) {
      action = 'Re-raise';
      tags.push('premium-hand', 'raise-for-value');
    } else if (positionClass === 'big-blind' && isBigBlindDefenseHand(handCode)) {
      action = 'Call';
      tags.push('big-blind-defense');
    } else if (positionClass !== 'early' && isReasonableContinueHand(handCode)) {
      action = 'Call';
      tags.push('position-advantage');
    } else {
      action = 'Fold';
    }
  } else if (actionContext === 'raise-and-callers') {
    if (['AA', 'KK', 'QQ', 'AKs', 'AKo'].includes(handCode)) {
      action = 'Re-raise';
      tags.push('premium-hand');
    } else if (stackDepth === 'deep' && isSpeculativeHand(handCode) && positionClass === 'late') {
      action = 'Call';
      tags.push('multiway-implied-odds');
    } else {
      action = 'Fold';
    }
  } else {
    action = 'Fold';
  }

  const explanation = buildExplanation('preflop', action, tags, input);

  const difficulty = computeDifficulty(input, action, tags);

  const mistakeTag = deriveMistakeTag(tags, handClass, positionClass, actionContext);

  return { correctAction: action, explanation, tags, mistakeTag, difficulty };
}

function computeDifficulty(input: DecisionInput, action: Action, tags: string[]): 1 | 2 | 3 | 4 | 5 {
  const { handClass, positionClass, opponentType, actionContext } = input;

  if (actionContext === 'three-bet-before-hero') return 4;
  // Limper isolation: strong hand + weak caller is a simple concept — don't inflate difficulty just because of opponent read
  if (tags.includes('calling-station-value')) return handClass === 'premium' ? 2 : 3;
  if (opponentType !== 'unknown') return 4;
  if (tags.includes('dominated-hand') || tags.includes('weak-ace-trap')) return 2;
  if (positionClass === 'late' && action === 'Raise') return 3;
  if (handClass === 'premium') return 1;
  if (handClass === 'trash') return 1;
  if (handClass === 'speculative') return 3;
  return 2;
}

function deriveMistakeTag(
  tags: string[],
  handClass: string,
  positionClass: string,
  actionContext: string,
): import('./types').MistakeTag | null {
  if (tags.includes('dominated-hand')) return 'played-dominated-hand';
  if (tags.includes('suited-junk-trap')) return 'overvalued-suited-junk';
  if (tags.includes('premium-hand') && actionContext === 'folded-to-hero') return 'failed-to-raise-premium';
  if (tags.includes('weak-ace-trap')) return 'weak-ace-trap';
  if (handClass === 'trap' && (positionClass === 'early' || positionClass === 'middle')) return 'played-too-loose-early';
  if (tags.includes('big-blind-defense')) return 'failed-to-defend-big-blind';
  if (tags.includes('three-bet-discipline')) return 'wrong-three-bet-spot';
  return null;
}
