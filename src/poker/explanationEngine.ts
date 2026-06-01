import type { Action, Street, DecisionInput } from './types';

export function buildExplanation(
  street: Street,
  action: Action,
  tags: string[],
  input: DecisionInput,
): string {
  if (street === 'preflop') return buildPreflopExplanation(action, tags, input);
  // Post-flop explanation builders plug in here
  return `${action} is the correct play here.`;
}

function buildPreflopExplanation(action: Action, tags: string[], input: DecisionInput): string {
  const { handCode, positionClass, actionContext, stackDepth, opponentType } = input;

  if (tags.includes('three-bet-discipline')) {
    if (action === 'Re-raise') {
      if (handCode === 'AA') {
        return `With AA you have the best possible hand. Re-raise and get the money in — you are ahead of everything.`;
      }
      if (handCode === 'KK') {
        return `With KK you are ahead of virtually every hand in the three-bettor's range. The only hand you fear is AA, which is rare. Re-raise and build the pot.`;
      }
      if (handCode === 'QQ') {
        return `With QQ you are strong enough to re-raise a three-bet at this stack depth. You are ahead of JJ, TT, and AK-type hands. KK and AA have you beat, but those are rare — re-raising is correct rather than calling and playing QQ out of position in a bloated pot.`;
      }
      // AKs, AKo
      return `With ${handCode} you have one of the strongest non-pair hands. ${handCode} blocks AA and KK (making them less likely), and has excellent equity against QQ, JJ, and weaker aces. This is not a made hand yet — you still need to connect with the board — but the equity and blockers make re-raising correct at this stack depth.`;
    }
    if (action === 'Call') {
      return `${handCode} is strong enough to continue but not always strong enough to re-raise for value into a three-bet. ${handCode} has real showdown value on its own — this is not pure set-mining. Calling preserves your options and lets you use position after the flop. If the board brings heavy action or dangerous overcards, be prepared to fold.`;
    }
    return `Facing a three-bet, you need a very strong hand to continue. ${handCode} is not strong enough here — casual players lose big pots refusing to fold attractive hands against obvious strength.`;
  }

  if (tags.includes('premium-hand')) {
    if (action === 'Raise' || action === 'Re-raise') {
      return `${handCode} is a premium hand. You should ${action.toLowerCase()} because you are likely ahead and want worse hands to pay you. Limping gives weak hands a cheap chance to outdraw you.`;
    }
  }

  if (tags.includes('dominated-hand')) {
    const highRank = handCode[0];
    const lowRank = handCode[1];
    if (actionContext === 'folded-to-hero') {
      // Below opening range threshold — explain the kicker problem
      return `${handCode} is below the opening range threshold here. The ${lowRank} kicker is the problem: if you flop top pair with the ${highRank}, anyone holding ${highRank}T, ${highRank}J, or ${highRank}Q has you dominated — same pair, better kicker. You can lose a big pot without knowing you are beat. Wait for a stronger hand.`;
    }
    return `${handCode} looks playable, but the ${lowRank} kicker makes it vulnerable. If you hit top pair, a better kicker beats you in a big pot. Folding avoids the classic "top pair, second-best hand" trap.`;
  }

  if (tags.includes('suited-junk-trap')) {
    return `Being suited adds some value, but it does not turn garbage into a strong hand. ${handCode} often makes weak pairs and rarely makes flushes.`;
  }

  if (tags.includes('small-pair-set-mine')) {
    if (action === 'Call') {
      return `Small pairs are playable when the price is cheap, stacks are ${stackDepth}, and you can win a large pot if you hit a set. If you miss the flop, usually give up.`;
    }
    return `Small pairs lose value against ${actionContext === 'early-raise' ? 'an early-position raise' : 'this action'} when stacks are ${stackDepth}. You need deep stacks to make set-mining profitable.`;
  }

  if (tags.includes('late-position-steal')) {
    const isAceSuited = handCode.endsWith('s') && handCode.startsWith('A');
    const isSuitedConnector = handCode.endsWith('s') && !handCode.startsWith('A') && !handCode.startsWith('K');
    const isLAG = opponentType === 'loose-aggressive' || opponentType === 'maniac';

    let handNote = '';
    if (isAceSuited) {
      handNote = ` ${handCode} is especially good for a steal: an ace blocks opponents from having strong ace hands, and the suited low cards give you flush and straight equity when called.`;
    } else if (isSuitedConnector) {
      handNote = ` ${handCode} is not a strong hand — this raise is not about hand strength. It is a steal. With only a few players left, they fold often enough that winning the blinds uncontested makes this profitable. If called, suited connectors have real equity through straight and flush draws.`;
    }

    const stackNote = stackDepth === 'short'
      ? ' Short-stacked, always raise-or-fold — never limp. Limping with a weak hand just bleeds chips.'
      : '';

    const lagNote = isLAG
      ? ' Warning: a loose-aggressive opponent may 3-bet you here. If they do, you can fold — the raise was still correct, you just ran into a strong counter.'
      : '';

    return `With only the blinds left to act, raising from late position steals the pot uncontested often enough to be profitable.${handNote}${stackNote}${lagNote} If called, you still have position on every street.`;
  }

  if (tags.includes('big-blind-defense')) {
    const raiseType = actionContext === 'late-raise' ? 'late-position' : '';
    const isSmallPairHand = ['22', '33', '44', '55', '66'].includes(handCode);
    if (isSmallPairHand) {
      return `From the big blind, you are already invested and get a discount to call. ${handCode} can defend against a ${raiseType} raise, but this is a marginal spot — your pair has little showdown value by itself. If you flop a set you can win a large pot; if you miss the flop and face pressure, give up quickly.`;
    }
    return `From the big blind, you are already invested and get a discount to call. ${handCode} is good enough to defend against a ${raiseType} raise.`;
  }

  if (tags.includes('respect-tight-raise')) {
    if (action === 'Call') {
      return `An early-position raise signals strength, but ${handCode} with deep stacks and position can continue. Call and play carefully post-flop — if the board brings overcards or you face heavy action, be willing to give up. Deep stacks and position make this call justifiable.`;
    }
    return `A tight player raising ${actionContext === 'early-raise' ? 'from early position' : ''} has a very strong range. ${handCode} does not play well against that range — folding saves you from losing big with the second-best hand.`;
  }

  if (tags.includes('multiway-implied-odds')) {
    return `With multiple players in the pot and deep stacks, ${handCode} has great implied odds. If you hit big you can win a large pot.`;
  }

  if (tags.includes('calling-station-value')) {
    return `Against a ${opponentType} opponent, you should raise for value. They will call too wide, so you want to build a pot with ${handCode}.`;
  }

  if (tags.includes('raise-for-value')) {
    return `${handCode} is a strong hand. Raising builds the pot and charges weaker hands to continue. Do not limp and let them in cheaply.`;
  }

  if (tags.includes('early-position-tight')) {
    return `From early position you need a strong hand because many players act after you. ${handCode} does not meet that standard — fold and wait for a better spot.`;
  }

  if (tags.includes('position-advantage')) {
    return `${handCode} is a reasonable hand here. ${action === 'Call' ? 'Calling' : 'Raising'} is correct because you have position — acting last gives you information and control on every street.`;
  }

  // Generic fallback
  const actionVerb = action === 'Fold' ? 'Folding' : action === 'Call' ? 'Calling' : 'Raising';
  if (action === 'Fold' && positionClass === 'big-blind') {
    const raiserType = actionContext === 'middle-raise' ? 'middle-position' : 'this';
    return `${handCode} has equity, but from the big blind you are out of position for the entire hand. You cannot reliably realize that equity against a ${raiserType} range — you will face c-bets and difficult decisions without the information advantage that position provides. Fold and wait for a better spot.`;
  }
  return `${actionVerb} is the correct play with ${handCode} from ${positionClass} position facing ${actionContext.replace(/-/g, ' ')}.`;
}
