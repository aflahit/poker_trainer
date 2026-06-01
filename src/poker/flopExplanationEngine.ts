import type {
  Action, MadeHandCategory, DrawCategory,
  BoardTexture, OpponentType, OpponentFlopAction,
  PreflopRole,
} from './types';

type FlopExplainInput = {
  bestAction: Action;
  tags: string[];
  madeHand: MadeHandCategory;
  draw: DrawCategory;
  board: BoardTexture;
  opponentType: OpponentType;
  opponentFlopAction: OpponentFlopAction;
  preflopRole: PreflopRole;
  isHeroInPosition: boolean;
};

export function buildFlopExplanation(input: FlopExplainInput): string {
  const { bestAction, tags, madeHand, draw, board, opponentType, opponentFlopAction } = input;

  if (tags.includes('do-not-marry-one-pair')) {
    return `One pair is not strong enough on this board. The board is dangerous, the action is serious, and paying off with just a pair is a common costly mistake. Fold and wait for a better spot.`;
  }

  if (tags.includes('respect-passive-aggression')) {
    const opp = opponentType === 'calling-station' ? 'calling station' : 'loose-passive player';
    return `A ${opp} rarely raises without a strong hand. When they do show aggression, their range is very narrow — sets, two pair, or better. One pair is not enough to continue.`;
  }

  if (tags.includes('do-not-bluff-calling-station')) {
    return `This opponent calls too much to fold to a bet. A bluff needs fold equity to work, and calling stations simply do not fold. Check and give up — do not light chips on fire.`;
  }

  if (tags.includes('let-maniac-bluff')) {
    if (bestAction === 'Call') {
      return `Against a maniac, calling keeps their bluffs alive. Raising might fold out the exact garbage hands you want them to keep betting with. Let them build the pot for you.`;
    }
    return `You are strong here and the maniac is betting into you. Raise for value — they will call or re-raise with worse.`;
  }

  if (tags.includes('charge-draws')) {
    return `The board is draw-heavy. If you are ahead now, make draws pay immediately — a free card could easily cost you the pot. Bet big and charge every flush and straight draw.`;
  }

  if (tags.includes('value-bet') && madeHand === 'monster') {
    if (board === 'wet' || board === 'very-wet') {
      return `You have a strong made hand on a dangerous board. Bet big — protect your equity, charge draws, and extract value. Do not slow-play on wet boards against casual opponents.`;
    }
    return `You have a strong made hand. Bet for value — worse hands can call, and checking gives a free card to hands that might improve past you.`;
  }

  if (tags.includes('value-bet') && madeHand === 'strong-made-hand') {
    if (opponentType === 'calling-station' || opponentType === 'loose-passive') {
      return `You have top pair with a strong kicker on a dry board. Against this opponent type, bet for value — they will call with weaker pairs and draws. This is exactly the spot to extract chips.`;
    }
    return `You have a strong made hand. Bet for value while you are ahead. Worse hands can call, and you want to build the pot now rather than let the turn change things.`;
  }

  if (tags.includes('pot-control')) {
    if (madeHand === 'medium-made-hand') {
      return `You have a made hand but it is not strong enough to build a large pot. Checking keeps the pot manageable and avoids getting called mostly by better hands. One pair with a weak kicker is a liability in a big pot.`;
    }
    return `Check to control the pot. Your hand has showdown value but is not strong enough to bet-call a raise.`;
  }

  if (tags.includes('c-bet')) {
    return `As the pre-flop raiser, this dry high-card board favors your range. A small continuation bet can win the pot immediately. Many hands simply miss this board and will fold.`;
  }

  if (tags.includes('semi-bluff')) {
    return `You have a strong draw with real equity. Betting as a semi-bluff applies pressure — you can win by fold equity now or by completing your draw on a later street.`;
  }

  if (tags.includes('strong-draw') || tags.includes('continue-draw')) {
    if (draw === 'combo-draw') {
      return `You have a combo draw with massive equity. Continuing is clear — you have many outs to improve to the best hand. Folding here would be a significant error.`;
    }
    if (draw === 'nut-flush-draw') {
      return `You have the nut flush draw. Against this bet size you have the equity to continue. If you hit, you will likely have the best hand and can get paid.`;
    }
    return `You have a strong draw with enough equity to continue at this price. Folding a strong draw to a small or medium bet is usually a mistake.`;
  }

  if (tags.includes('fold-weak-draw') || tags.includes('bad-price')) {
    if (draw === 'gutshot') {
      return `A gutshot has only 4 outs — about an 8% chance to complete on the next card. Calling a big bet with those odds is losing chips in the long run.`;
    }
    if (draw === 'two-overcards') {
      return `Two overcards give you at most 6 outs, and those outs might not even win. Facing a big bet with only a backdoor draw and no pair is not a profitable call.`;
    }
    return `Your draw is too weak to justify calling a large bet. You are behind now and unlikely to have enough outs to make this call mathematically sound.`;
  }

  if (tags.includes('missed-hand')) {
    if (opponentFlopAction !== 'checks-to-hero') {
      return `You have nothing here. You missed the flop and are facing a bet. Fold and wait for a better spot — calling with no pair and no draw is burning chips.`;
    }
    return `You missed the flop completely. Without fold equity or a strong board texture, checking is the right play. Do not bluff without a reason.`;
  }

  if (tags.includes('big-bet-pressure')) {
    return `Facing a big bet with a medium-strength hand is a losing proposition. The bet polarizes the opponent's range toward value — your one pair is likely behind. Fold.`;
  }

  return `${bestAction} is the best play here given your hand strength, the board, and the action.`;
}
