/**
 * Deck management - HP = draw_pile + hand + recharge_pile.
 * discard_pile = damage taken (NEVER reshuffled back).
 */
export class Deck {
  constructor() {
    this.masterDeck = [];
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
    this.damagePile = [];
    this.rechargePile = [];
    this.playPile = [];
  }

  addCard(card) {
    this.masterDeck.push(card);
  }

  removeCard(card) {
    const idx = this.masterDeck.indexOf(card);
    if (idx !== -1) {
      this.masterDeck.splice(idx, 1);
      return true;
    }
    return false;
  }

  shuffleDrawPile() {
    for (let i = this.drawPile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
    }
  }

  startCombat(classHandSize = 4, maxHandSize = 10) {
    this.drawPile = this.masterDeck.map(c => c.copy());
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
    this.damagePile = [];
    this.rechargePile = [];
    this.playPile = [];
    this.shuffleDrawPile();
    return this.draw(classHandSize, maxHandSize);
  }

  isInCombat() {
    return this.drawPile.length > 0 || this.hand.length > 0 ||
      this.rechargePile.length > 0 || this.playPile.length > 0;
  }

  endCombat() {
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
    this.damagePile = [];
    this.rechargePile = [];
    this.playPile = [];
  }

  draw(count = 1, maxHandSize = 10) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.hand.length >= maxHandSize) break;
      if (this.drawPile.length === 0) break;
      const card = this.drawPile.pop();
      this.hand.push(card);
      drawn.push(card);
    }
    return drawn;
  }

  playCard(card) {
    const idx = this.hand.indexOf(card);
    if (idx === -1) return false;
    this.hand.splice(idx, 1);
    // Card leaving hand resets any "stay-in-hand" exhaust flag
    card.exhausted = false;

    switch (card.costType) {
      case 'RECHARGE':
        // Goes into the recharge pile (held until end of turn, then flushed under the deck)
        this.addToRechargePile(card);
        break;
      case 'EXHAUST':
        this.exhaustPile.push(card);
        break;
      case 'BANISH':
        // removed from game entirely
        this.masterDeck = this.masterDeck.filter(c => c.id !== card.id || c.uid !== card.uid);
        break;
      case 'FREE':
      case 'DISCARD':
      default:
        this.discardPile.push(card);
        break;
    }
    return true;
  }

  // Add a card to the recharge pile.
  // Convention: rechargePile[0] = top, rechargePile[N-1] = bottom.
  // The first card recharged sits at the top; each subsequent card goes UNDER (further down).
  addToRechargePile(card) {
    card.exhausted = false;
    this.rechargePile.push(card);
  }

  banishCard(card) {
    // Remove from all piles and master deck
    for (const pile of [this.hand, this.drawPile, this.discardPile, this.rechargePile, this.playPile]) {
      const idx = pile.indexOf(card);
      if (idx !== -1) pile.splice(idx, 1);
    }
    this.masterDeck = this.masterDeck.filter(c => c.id !== card.id);
  }

  discardFromHand(card) {
    const idx = this.hand.indexOf(card);
    if (idx === -1) return false;
    this.hand.splice(idx, 1);
    this.discardPile.push(card);
    return true;
  }

  discardHand() {
    const discarded = [...this.hand];
    this.discardPile.push(...this.hand);
    this.hand = [];
    return discarded;
  }

  addToHand(card) {
    this.hand.push(card);
  }

  addToDrawPile(card, position = 'random') {
    if (position === 'top') {
      this.drawPile.push(card);
    } else if (position === 'bottom') {
      this.drawPile.unshift(card);
    } else {
      const idx = Math.floor(Math.random() * (this.drawPile.length + 1));
      this.drawPile.splice(idx, 0, card);
    }
  }

  moveToPlayPile(card) {
    const idx = this.hand.indexOf(card);
    if (idx === -1) return false;
    this.hand.splice(idx, 1);
    this.playPile.push(card);
    return true;
  }

  playPileToDiscard(card) {
    const idx = this.playPile.indexOf(card);
    if (idx === -1) return false;
    this.playPile.splice(idx, 1);
    this.discardPile.push(card);
    return true;
  }

  playPileToRecharge(card) {
    const idx = this.playPile.indexOf(card);
    if (idx === -1) return false;
    this.playPile.splice(idx, 1);
    this.rechargePile.push(card);
    return true;
  }

  damageFromDrawPile() {
    // Take from top of draw pile first, then from top of recharge pile.
    // Returns null if both are empty.
    if (this.drawPile.length > 0) {
      const card = this.drawPile.pop();
      this.damagePile.push(card);
      return card;
    }
    if (this.rechargePile.length > 0) {
      // Top of recharge pile = end of array (since we push to end as "bottom" — wait,
      // recharge pile convention: index 0 = top. So top is shift().
      const card = this.rechargePile.shift();
      this.damagePile.push(card);
      return card;
    }
    return null;
  }

  // Total cards available for "deck" damage (drawPile + rechargePile)
  deckDamageAvailable() {
    return this.drawPile.length + this.rechargePile.length;
  }

  damageFromHand(card) {
    const idx = this.hand.indexOf(card);
    if (idx === -1) return false;
    this.hand.splice(idx, 1);
    this.damagePile.push(card);
    return true;
  }

  flushRechargePile() {
    // The recharge pile is moved UNDER the draw pile.
    // Within the recharge pile: index 0 = top, index N-1 = bottom.
    // Cards deeper in the recharge pile (higher index) end up deeper in the deck.
    // Draw pile convention: index 0 = bottom (deepest), pop() draws from the top.
    // Pushing the recharge pile cards in reverse so the deepest one ends at the very bottom.
    const count = this.rechargePile.length;
    for (const card of this.rechargePile) {
      this.drawPile.unshift(card);
    }
    this.rechargePile = [];
    return count;
  }

  endTurn(classHandSize = 4, maxHandSize = 10) {
    this.flushRechargePile();
    return this.draw(classHandSize, maxHandSize);
  }
}
