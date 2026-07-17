export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const SUITS = [
  { symbol: '♥', color: 'red' },
  { symbol: '♦', color: 'red' },
  { symbol: '♣', color: 'black' },
  { symbol: '♠', color: 'black' }
];


export const AI_TURN_DELAY = 3000; 


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function createAndShuffleDeck(delayTime = 0) {
  if (delayTime > 0) await delay(delayTime);
  const freshDeck = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      freshDeck.push({ rank, suit });
    }
  }
 
  for (let i = freshDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [freshDeck[i], freshDeck[j]] = [freshDeck[j], freshDeck[i]];
  }
  return freshDeck;
}

export async function processBooks(hand, isPlayer, logsArray, delayTime = 0) {
  if (delayTime > 0) await delay(delayTime);
  const counts = {};
  hand.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);

  let updatedHand = [...hand];
  let booksFound = 0;

  for (const rank in counts) {
    if (counts[rank] === 4) {
      
      updatedHand = updatedHand.filter(c => c.rank !== rank);
      booksFound++;
      if (isPlayer) {
        logsArray.push(`🎉 You completed the set of four for [${rank}]!`);
      } else {
        logsArray.push(`🤖 Computer completed the set of four for [${rank}].`);
      }
    }
  }
  return { updatedHand, booksFound };
}