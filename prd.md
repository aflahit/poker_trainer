# PRD: Texas Hold’em Puzzle Trainer

## 1. Product Summary

Texas Hold’em Puzzle Trainer is a lightweight training game that teaches pre-flop poker decision-making through repeated situational puzzles.

The player is shown a poker situation: number of players, blind level, table position, hole cards, previous player actions, opponent type, stack depth, and pot size. The player chooses an action: **Fold**, **Call**, **Raise**, or sometimes **Re-raise**. The system scores the answer using a rule-based strategy engine and gives a clear explanation.

The main goal is not to teach professional GTO poker. The goal is to make the player dangerous in casual home games by building disciplined instincts:

- Fold weak trap hands.
- Raise strong hands.
- Avoid dominated hands.
- Play more hands in late position.
- Punish loose passive players.
- Avoid fancy bluffs too early.

---

## 2. Target User

Primary user:

- Casual poker player who knows basic Texas Hold’em rules.
- Wants to become much better quickly.
- Prefers puzzle-based practice over memorizing charts.
- Plays mostly with friends, not professionally.

Secondary user:

- Beginner learning pre-flop poker discipline.
- Wants instant feedback and simple heuristics.

---

## 3. Core Learning Objective

The player should internalize this decision pattern:

> “Given my position, hole cards, action before me, stack depth, and opponent type, should I fold, call, raise, or re-raise?”

The first version focuses only on **pre-flop** decisions.

Later versions may add:

- Flop decision puzzles.
- Draw/pot odds puzzles.
- Turn/river value betting puzzles.
- Opponent profiling puzzles.
- Casual home-game exploit mode.

---

## 4. Game Modes

### 4.1 Drill Mode

The player receives one puzzle at a time.

Each puzzle contains:

- Number of players.
- Blind level.
- Stack depth.
- Player position.
- Hole cards.
- Action before the player.
- Opponent profile, if relevant.
- Current pot size.
- Available actions.

The player chooses an action.

The game immediately reveals:

- Correct action.
- Whether the player was correct.
- Explanation.
- Mistake category, if wrong.

Example mistake categories:

- Played dominated hand.
- Overvalued suited junk.
- Failed to raise premium hand.
- Called when should raise.
- Played too loose from early position.
- Failed to defend reasonable big blind hand.
- Got baited by weak ace.

---

### 4.2 Streak Mode

The player tries to answer as many puzzles correctly as possible in a row.

Scoring:

- Correct answer: +1 streak.
- Wrong answer: streak resets to 0.
- Best streak is saved.

Purpose:

- Builds automatic instincts.
- Useful for daily practice.

---

### 4.3 Timed Mode

The player answers as many puzzles as possible within a fixed time.

Suggested duration:

- 3 minutes.
- 5 minutes.
- 10 minutes.

Scoring:

- Correct: +10 points.
- Wrong: -5 points.
- Skipped: 0 points.
- Fast correct answer bonus: +2 points.

Purpose:

- Simulates real-table pressure.
- Prevents overthinking simple pre-flop spots.

---

### 4.4 Weakness Training Mode

The game tracks mistake categories and generates more puzzles from the player’s weak areas.

Example:

If the player often calls weak aces from early position, the game generates more weak-ace trap puzzles.

---

## 5. Core Game Loop

1. Generate puzzle.
2. Display table situation.
3. Player chooses action.
4. Strategy engine evaluates answer.
5. Game shows result and explanation.
6. Player receives score update.
7. Game logs mistake category.
8. Next puzzle is generated.

Loop:

```text
Generate Situation → Player Decision → Evaluate → Explain → Score → Generate Next Situation
```

---

## 6. Puzzle Data Model

```ts
type CardRank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
type Suit = 's' | 'h' | 'd' | 'c';

type Card = {
  rank: CardRank;
  suit: Suit;
};

type Position =
  | 'UTG'
  | 'UTG+1'
  | 'Middle'
  | 'Hijack'
  | 'Cutoff'
  | 'Button'
  | 'Small Blind'
  | 'Big Blind';

type OpponentType =
  | 'unknown'
  | 'tight'
  | 'loose-passive'
  | 'loose-aggressive'
  | 'maniac'
  | 'calling-station';

type PreviousAction =
  | 'folded-to-hero'
  | 'one-limper'
  | 'multiple-limpers'
  | 'early-raise'
  | 'middle-raise'
  | 'late-raise'
  | 'raise-and-callers'
  | 'three-bet-before-hero';

type StackDepth = 'short' | 'medium' | 'deep';

type Action = 'Fold' | 'Call' | 'Raise' | 'Re-raise';

type Puzzle = {
  id: string;
  playerCount: number;
  blinds: {
    small: number;
    big: number;
  };
  stackDepth: StackDepth;
  heroPosition: Position;
  heroCards: [Card, Card];
  previousAction: PreviousAction;
  opponentType: OpponentType;
  potSize: number;
  availableActions: Action[];
  correctAction: Action;
  explanation: string;
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
};
```

---

## 7. Hand Classification

The generator first converts the two hole cards into a normalized hand code.

Examples:

```text
A♠ A♦ → AA
A♠ K♠ → AKs
A♠ K♦ → AKo
9♥ 8♥ → 98s
9♥ 8♣ → 98o
```

### 7.1 Hand Categories

#### Premium Hands

```text
AA, KK, QQ, JJ, TT, AKs, AKo
```

Default action:

- Raise if unopened.
- Re-raise against most raises.
- Never fold pre-flop in normal casual-game conditions.

#### Strong Hands

```text
AQs, AQo, AJs, KQs, 99, 88
```

Default action:

- Raise if unopened.
- Usually continue against a raise.
- Be more careful against tight early-position raises.

#### Medium Playable Hands

```text
77, 66, 55, ATs, A9s, KJs, KQo, QJs, JTs, T9s
```

Default action:

- Play more often in middle/late position.
- Avoid against strong early raises.
- Prefer position.

#### Speculative Hands

```text
44, 33, 22, A5s-A2s, 98s, 87s, 76s, 65s, KTs, QTs, J9s, T8s
```

Default action:

- Play mostly in late position.
- Call sometimes with multiple limpers and deep stacks.
- Raise when folded to in late position.
- Fold against large raises unless conditions are favorable.

#### Trap Hands

```text
A9o-A2o, KJo, KTo, QTo, K9o, Q9o, JTo, weak suited kings, weak suited queens
```

Default action:

- Usually fold early and middle.
- Sometimes play late if folded to, depending on exact hand.
- Avoid calling raises with these.

#### Trash Hands

```text
72o, 83o, 94o, T3o, J5o, Q6o, K4o, 96o, 52o and similar
```

Default action:

- Fold almost always.

---

## 8. Strategy Engine: Rule-Based Solution Generator

The solution engine should be deterministic enough to teach consistent rules, but flexible enough to generate many puzzles.

The core function:

```ts
function solvePreflop(puzzleInput: PuzzleInput): Solution {
  const handCode = normalizeHand(puzzleInput.heroCards);
  const handClass = classifyHand(handCode);
  const positionClass = classifyPosition(puzzleInput.heroPosition);
  const actionContext = classifyPreviousAction(puzzleInput.previousAction);

  const action = decideAction({
    handCode,
    handClass,
    positionClass,
    actionContext,
    stackDepth: puzzleInput.stackDepth,
    opponentType: puzzleInput.opponentType,
    playerCount: puzzleInput.playerCount,
  });

  return buildSolution(action, explanationTags);
}
```

---

## 9. Position Classes

```ts
type PositionClass = 'early' | 'middle' | 'late' | 'small-blind' | 'big-blind';
```

Mapping:

```text
UTG, UTG+1 → early
Middle, Hijack → middle
Cutoff, Button → late
Small Blind → small-blind
Big Blind → big-blind
```

Core rule:

```text
Earlier position = tighter hand range.
Later position = wider hand range.
```

---

## 10. Opening Range Rules

These rules apply when previousAction is `folded-to-hero`.

### 10.1 Early Position Opening Range

Raise:

```text
77+, AQo+, AJs+, KQs
```

Fold everything else.

### 10.2 Middle Position Opening Range

Raise:

```text
55+, AJo+, ATs+, KQo, KJs+, QJs, JTs, T9s
```

Fold everything else.

### 10.3 Late Position Opening Range

Raise:

```text
22+, A2s+, ATo+, KJo+, QJo, KTs+, QTs+, JTs, T9s, 98s, 87s, 76s, 65s
```

Fold the weakest off-suit junk.

### 10.4 Small Blind Opening Range

Raise:

```text
55+, A8o+, A2s+, KTo+, K9s+, QTs+, JTs, T9s, 98s
```

Fold weak off-suit junk.

Small blind is intentionally tighter than button because hero will act first after the flop.

---

## 11. Limped Pot Rules

These rules apply when one or more players limped before hero.

### 11.1 Against One Limper

Raise for value/isolation with:

```text
88+, AQo+, AJs+, KQs, KJs, QJs
```

Call with speculative hands if in late position or deep stacks:

```text
22-77, A2s-A5s, suited connectors 65s+, suited one-gappers like T8s/J9s
```

Fold:

```text
Weak off-suit aces, weak kings, weak queens, suited junk
```

### 11.2 Against Multiple Limpers

Raise with strong hands:

```text
TT+, AK, AQ, AJs, KQs
```

Call with speculative hands in position:

```text
22-99, A2s-A5s, suited connectors 65s+, suited broadways
```

Fold dominated and trash hands.

---

## 12. Facing Raise Rules

These rules apply when another player has raised before hero.

### 12.1 Against Early-Position Raise

Continue with:

```text
TT+, AK, AQs
```

Sometimes call:

```text
99, 88, AQo, AJs, KQs
```

Call small pairs only if:

```text
stackDepth = deep
```

Fold:

```text
Weak aces, KJ, KT, QJ, QT, suited junk, low connectors
```

### 12.2 Against Middle-Position Raise

Continue with:

```text
99+, AQ+, AJs+, KQs
```

Call in position with:

```text
77-88, suited broadways, A5s-A2s, good suited connectors
```

Fold dominated off-suit hands.

### 12.3 Against Late-Position Raise

Continue wider, especially from big blind.

Re-raise with:

```text
JJ+, AK, AQs
```

Call/defend with:

```text
66+, ATs+, AJo+, KQs, KJs, QJs, JTs, T9s, 98s
```

Big blind can defend slightly wider because already invested, but should still fold trash.

---

## 13. Three-Bet Rules

These rules apply when there has already been a raise and re-raise before hero.

Continue only with very strong hands:

```text
QQ+, AK
```

Sometimes continue with:

```text
JJ, AQs
```

Fold almost everything else.

Teaching goal:

> Casual players lose huge pots by refusing to fold pretty but dominated hands against obvious strength.

---

## 14. Stack Depth Adjustments

### 14.1 Short Stack

Short stack means around 20 big blinds or less.

Adjustments:

- Speculative hands lose value.
- Small pairs lose value if calling just to hit a set.
- High-card strength increases.
- Prefer raise/fold over call.

### 14.2 Medium Stack

Medium stack means around 30-80 big blinds.

Adjustments:

- Default strategy applies.

### 14.3 Deep Stack

Deep stack means 100 big blinds or more.

Adjustments:

- Small pairs improve.
- Suited connectors improve.
- Implied odds hands become better in position.
- Still avoid dominated off-suit hands.

---

## 15. Opponent Type Adjustments

### 15.1 Tight Opponent

If a tight player raises:

- Narrow continuing range.
- Fold more dominated hands.
- Respect early-position raises.

### 15.2 Loose-Passive Opponent

If a loose-passive player limps:

- Raise strong hands for value.
- Do not bluff too much.
- Isolate with hands that dominate their range.

### 15.3 Calling Station

Against calling station:

- Raise premium and strong hands.
- Avoid bluff-heavy plays.
- Value bet relentlessly post-flop.

Pre-flop impact:

- Raise good hands bigger.
- Do not raise trash just expecting folds.

### 15.4 Maniac / Loose-Aggressive

Against frequent raiser:

- Re-raise strong hands.
- Call less with weak speculative hands out of position.
- Let them make mistakes when you hold strong hands.

---

## 16. Puzzle Generation Formula

The game can generate endless puzzle-solution pairs using weighted random generation plus deterministic solving.

### 16.1 High-Level Formula

```text
Puzzle = RandomSituation(seed)
Solution = StrategyEngine(Puzzle)
Explanation = ExplanationEngine(Puzzle, Solution)
```

Where:

```text
RandomSituation(seed)
  → player count
  → blinds
  → stack depth
  → position
  → hole cards
  → previous action
  → opponent type
  → pot size
```

Then:

```text
StrategyEngine(situation)
  → correct action
  → explanation tags
  → difficulty
```

---

## 17. Weighted Random Puzzle Generator

### 17.1 Randomly Choose Puzzle Theme

```ts
type PuzzleTheme =
  | 'premium-open'
  | 'trap-hand-fold'
  | 'late-position-steal'
  | 'suited-junk-trap'
  | 'small-pair-set-mine'
  | 'facing-tight-raise'
  | 'big-blind-defense'
  | 'limper-isolation'
  | 'multiway-speculative-call'
  | 'three-bet-discipline';
```

Suggested weights:

```ts
const themeWeights = {
  'premium-open': 10,
  'trap-hand-fold': 18,
  'late-position-steal': 12,
  'suited-junk-trap': 12,
  'small-pair-set-mine': 10,
  'facing-tight-raise': 12,
  'big-blind-defense': 8,
  'limper-isolation': 10,
  'multiway-speculative-call': 5,
  'three-bet-discipline': 3,
};
```

Rationale:

The generator should over-train common casual-player leaks:

- Weak ace overplay.
- Suited junk overplay.
- Calling raises with dominated hands.
- Limping too often.
- Failing to raise premium hands.

---

## 18. Theme-Based Puzzle Templates

### 18.1 Premium Open

Purpose:

- Teach player to raise strong hands instead of limping.

Generator constraints:

```text
previousAction = folded-to-hero
handClass = premium or strong
position = any
correctAction = Raise
```

Example:

```text
Hero: QQ
Position: Early
Action: folded to hero
Correct: Raise
```

---

### 18.2 Trap Hand Fold

Purpose:

- Teach player to fold hands that look pretty but lose big pots.

Generator constraints:

```text
handClass = trap
position = early or middle
previousAction = folded-to-hero or early-raise
correctAction = Fold
```

Example:

```text
Hero: A7o
Position: Early
Action: folded to hero
Correct: Fold
```

---

### 18.3 Late Position Steal

Purpose:

- Teach player to raise more hands from cutoff/button when folded to.

Generator constraints:

```text
position = cutoff or button
previousAction = folded-to-hero
handClass = medium playable or speculative
correctAction = Raise
```

Example:

```text
Hero: A5s
Position: Button
Action: folded to hero
Correct: Raise
```

---

### 18.4 Suited Junk Trap

Purpose:

- Teach player that suited cards are not automatically good.

Generator constraints:

```text
hand = weak suited hand
position = early or middle
previousAction = folded-to-hero or one-limper
correctAction = Fold
```

Example:

```text
Hero: K4s
Position: Middle
Action: one limper
Correct: Fold
```

---

### 18.5 Small Pair Set Mine

Purpose:

- Teach when small pairs are playable.

Generator constraints:

```text
hand = 22-66
stackDepth = deep
previousAction = multiple-limpers or small raise
position = late or big blind
correctAction = Call
```

Counter-example variant:

```text
hand = 22-66
stackDepth = short
previousAction = large raise
correctAction = Fold
```

---

### 18.6 Facing Tight Raise

Purpose:

- Teach respect for early-position strength.

Generator constraints:

```text
opponentType = tight
previousAction = early-raise
handClass = trap or medium playable
correctAction = Fold
```

Example:

```text
Hero: KJo
Position: Middle
Action: tight early player raises
Correct: Fold
```

---

### 18.7 Big Blind Defense

Purpose:

- Teach that big blind can defend wider, but not with garbage.

Generator constraints:

```text
position = Big Blind
previousAction = late-raise or middle-raise
handClass varies
```

Solution logic:

- Defend playable suited/broadway/pair hands against late raise.
- Fold trash and dominated off-suit hands.

---

### 18.8 Limper Isolation

Purpose:

- Teach player to raise strong hands against weak limpers.

Generator constraints:

```text
previousAction = one-limper
opponentType = loose-passive or calling-station
handClass = strong or premium
correctAction = Raise
```

Example:

```text
Hero: AQ suited
Position: Cutoff
Action: loose player limps
Correct: Raise
```

---

### 18.9 Multiway Speculative Call

Purpose:

- Teach when suited connectors and small pairs are useful.

Generator constraints:

```text
previousAction = multiple-limpers
position = cutoff/button/big blind
stackDepth = deep
handClass = speculative
correctAction = Call
```

Example:

```text
Hero: 98s
Position: Button
Action: three limpers
Correct: Call
```

---

### 18.10 Three-Bet Discipline

Purpose:

- Teach player to fold good-looking but not elite hands when action is very strong.

Generator constraints:

```text
previousAction = three-bet-before-hero
handClass = strong but not premium
correctAction = Fold or Call depending on hand
```

Example:

```text
Hero: AQo
Action: early raise, middle re-raise
Correct: Fold
```

---

## 19. Deterministic Solution Logic

Pseudo-code:

```ts
function decideAction(input: DecisionInput): Action {
  const { handCode, handClass, positionClass, actionContext, stackDepth, opponentType } = input;

  if (actionContext === 'three-bet-before-hero') {
    if (['AA', 'KK', 'QQ', 'AKs', 'AKo'].includes(handCode)) return 'Re-raise';
    if (['JJ', 'AQs'].includes(handCode) && stackDepth !== 'short') return 'Call';
    return 'Fold';
  }

  if (actionContext === 'folded-to-hero') {
    if (isInOpeningRange(handCode, positionClass)) return 'Raise';
    return 'Fold';
  }

  if (actionContext === 'one-limper') {
    if (isStrongIsolationHand(handCode)) return 'Raise';
    if (positionClass === 'late' && stackDepth === 'deep' && isSpeculativeHand(handCode)) return 'Call';
    return 'Fold';
  }

  if (actionContext === 'multiple-limpers') {
    if (isVeryStrongHand(handCode)) return 'Raise';
    if ((positionClass === 'late' || positionClass === 'big-blind') && stackDepth === 'deep' && isSpeculativeHand(handCode)) return 'Call';
    return 'Fold';
  }

  if (actionContext === 'early-raise') {
    if (['AA', 'KK', 'QQ', 'AKs', 'AKo'].includes(handCode)) return 'Re-raise';
    if (['JJ', 'TT', 'AQs'].includes(handCode)) return 'Call';
    if (stackDepth === 'deep' && isSmallPair(handCode)) return 'Call';
    return 'Fold';
  }

  if (actionContext === 'middle-raise') {
    if (['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'].includes(handCode)) return 'Re-raise';
    if (['TT', '99', 'AQs', 'AQo', 'AJs', 'KQs'].includes(handCode)) return 'Call';
    if (positionClass === 'late' && stackDepth === 'deep' && isGoodSpeculativeHand(handCode)) return 'Call';
    return 'Fold';
  }

  if (actionContext === 'late-raise') {
    if (['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs'].includes(handCode)) return 'Re-raise';
    if (positionClass === 'big-blind' && isBigBlindDefenseHand(handCode)) return 'Call';
    if (positionClass !== 'early' && isReasonableContinueHand(handCode)) return 'Call';
    return 'Fold';
  }

  return 'Fold';
}
```

---

## 20. Explanation Engine

The explanation engine should not merely say “correct” or “wrong.” It should explain the poker idea behind the answer.

### 20.1 Explanation Tags

Possible tags:

```text
premium-hand
raise-for-value
position-advantage
early-position-tight
late-position-steal
dominated-hand
weak-ace-trap
suited-junk-trap
small-pair-set-mine
respect-tight-raise
big-blind-defense
multiway-implied-odds
three-bet-discipline
calling-station-value
avoid-fancy-play
```

### 20.2 Explanation Template Examples

#### Premium Hand

```text
This is a premium hand. You should raise or re-raise because you are likely ahead and want worse hands to pay you. Limping gives weak hands a cheap chance to outdraw you.
```

#### Dominated Hand

```text
This hand looks playable, but it is often dominated. If you hit top pair, a better kicker can still beat you. Folding avoids losing a big pot with a second-best hand.
```

#### Suited Junk

```text
Being suited adds some value, but it does not turn garbage into a strong hand. Weak suited hands often make weak pairs and rarely make flushes.
```

#### Small Pair Set Mine

```text
Small pairs are playable when the price is cheap, stacks are deep, and you can win a large pot if you hit a set. If you miss the flop, you should usually give up.
```

#### Position Advantage

```text
Late position lets you act after other players post-flop. That information advantage allows you to play more hands profitably.
```

---

## 21. Difficulty System

### Difficulty 1: Obvious Fundamentals

Examples:

- AA folded to hero → Raise.
- 72o early position → Fold.
- QQ facing late raise → Re-raise.

### Difficulty 2: Common Beginner Traps

Examples:

- A7o early → Fold.
- K4s middle → Fold.
- QTo facing early raise → Fold.

### Difficulty 3: Position-Based Decisions

Examples:

- A5s button folded to hero → Raise.
- 98s button after multiple limpers → Call.
- 22 early folded to hero → Fold or Raise depending simplified range.

### Difficulty 4: Opponent Adjustments

Examples:

- KQo versus tight early raise → Fold.
- AQ suited versus loose limper → Raise.
- 77 versus maniac late raise → Call/Re-raise depending mode.

### Difficulty 5: Borderline Decisions

Examples:

- AJs versus tight middle raise.
- 99 facing early raise with medium stack.
- KQs out of position versus strong raise.

For early versions, difficulty 5 can be avoided or labeled as “advanced / close spot.”

---

## 22. Scoring System

### Basic Score

- Correct answer: +10
- Wrong answer: 0

### Streak Bonus

- 3 correct in a row: +5
- 5 correct in a row: +10
- 10 correct in a row: +25

### Difficulty Multiplier

```text
Difficulty 1: x1.0
Difficulty 2: x1.2
Difficulty 3: x1.5
Difficulty 4: x2.0
Difficulty 5: x3.0
```

### Mistake Penalty in Timed Mode

- Wrong answer: -5
- Timeout: -2

---

## 23. Player Progress Tracking

Track:

- Total puzzles answered.
- Accuracy percentage.
- Accuracy by hand category.
- Accuracy by position.
- Accuracy by previous action.
- Most common mistake tag.
- Best streak.
- Timed mode best score.

Example insights:

```text
You often overplay weak aces from early position.
You correctly raise premium hands, but you call too often with speculative hands against raises.
Your button opening decisions are improving.
```

---

## 24. MVP Scope

### Included in MVP

- Pre-flop only.
- Puzzle generation engine.
- Deterministic solution engine.
- Explanation engine.
- Drill mode.
- Score and streak.
- Mistake tags.
- Basic progress summary.

### Not Included in MVP

- Full poker simulation.
- Multiplayer.
- Real money.
- GTO solver.
- Post-flop strategy.
- Casino-style blackjack training.
- Login/account system.

---

## 25. UI Requirements

Puzzle screen should show:

- Table summary.
- Hero position.
- Hole cards.
- Previous action.
- Opponent type.
- Stack depth.
- Pot size.
- Action buttons.
- Feedback panel after answer.

Suggested layout:

```text
Top: Score / streak / progress
Center: Poker table situation
Bottom: Fold / Call / Raise / Re-raise buttons
After answer: Correct play + explanation + next button
```

---

## 26. Non-Goals

This app should not pretend to be a complete poker solver.

It should teach a simple, practical, exploitative strategy suitable for casual poker games.

Explicit non-goals:

- Perfect professional poker theory.
- Complex mixed-frequency decisions.
- Real-money gambling optimization.
- Encouraging gambling addiction.

---

## 27. Success Criteria

The product is successful if the player can:

- Correctly fold weak aces and suited junk.
- Correctly raise premium hands.
- Understand why position matters.
- Avoid calling raises with dominated hands.
- Recognize when small pairs and suited connectors are playable.
- Achieve at least 85% accuracy on difficulty 1-3 pre-flop puzzles.

Practical target:

> After one month of practice, the player should be significantly stronger than casual friends who play too many hands and call too much.

---

## 28. Future Expansion

### 28.1 Flop Puzzle Mode

Add board cards and post-flop decision-making.

Puzzle examples:

- Top pair good kicker.
- Top pair weak kicker.
- Overpair.
- Flush draw.
- Open-ended straight draw.
- Missed overcards.
- Two pair or better.

### 28.2 Casual Opponent Exploit Mode

Train against common friend archetypes:

- Calling station.
- Maniac.
- Scared folder.
- Fake expert.
- Drunk gambler.

### 28.3 Pot Odds Mode

Teach simple draw math:

- Flush draw.
- Open-ended straight draw.
- Gutshot straight draw.
- Combo draw.

### 28.4 Tournament Mode

Add stack pressure and blind increases.

### 28.5 Blackjack Side Mode

Add basic blackjack strategy drills later.

---

## 29. Implementation Notes

The core architecture should separate generation from solving.

Recommended modules:

```text
/poker
  cards.ts
  handNormalizer.ts
  handClassifier.ts
  positionClassifier.ts
  puzzleGenerator.ts
  strategyEngine.ts
  explanationEngine.ts
  scoring.ts
```

Main principle:

```text
Never hardcode the answer inside the puzzle.
Generate situation first, then solve it using the strategy engine.
```

This allows endless variation while keeping answers consistent.

---

## 30. Example Generated Puzzle

Input:

```json
{
  "playerCount": 8,
  "blinds": { "small": 500, "big": 1000 },
  "stackDepth": "deep",
  "heroPosition": "Button",
  "heroCards": ["4s", "4d"],
  "previousAction": "multiple-limpers",
  "opponentType": "loose-passive",
  "potSize": 4500
}
```

Engine output:

```json
{
  "correctAction": "Call",
  "difficulty": 2,
  "tags": ["small-pair-set-mine", "multiway-implied-odds", "position-advantage"],
  "explanation": "Small pairs are playable when the price is cheap, stacks are deep, and you can win a large pot if you hit a set. With multiple limpers and position, calling is better than folding. If you miss the flop, usually give up."
}
```

---

## 31. MVP Build Order

1. Build card and hand normalization utilities.
2. Build hand classification.
3. Build position classification.
4. Build opening range checks.
5. Build previous-action decision rules.
6. Build puzzle generator using weighted themes.
7. Build explanation engine.
8. Build drill UI.
9. Add scoring and streak.
10. Add progress tracking by mistake tag.

---

## 32. Design Philosophy

This trainer should feel like a poker coach saying:

> “Stop being cute. Fold the trash. Raise your good hands. Don’t pay people off with second-best hands.”

The tone should be direct, slightly playful, and memorable.

The app should reward disciplined boring decisions because boring discipline is what beats casual poker tables.

