/**
 * Deck management — HP = draw_pile + hand + recharge_pile.
 *
 * Persistent between combats:
 *   hand         — cards the player is holding (survives combat)
 *   discardPile  — damage taken, in exact order (top = most recent)
 *
 * Rebuilt each combat:
 *   drawPile     — masterDeck minus hand minus discard, freshly shuffled
 *
 * Transient (cleared at end of combat):
 *   rechargePile, damagePile, playPile
 */
export class Deck {
  constructor() {
    this.masterDeck = [];
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];  // persists between combats — represents damage
    this.damagePile = [];
    this.rechargePile = [];
    this.playPile = [];
  }

  addCard(card, toHand = false) {
    this.masterDeck.push(card);
    if (toHand) {
      this.hand.push(card.copy ? card.copy() : card);
    }
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

  // Build draw pile from masterDeck, excluding cards already in hand and
  // removing N cards equal to discardPile length (persistent damage).
  // Hand and discard pile are NOT touched — they persist.
  startCombat(classHandSize = 4, maxHandSize = 10) {
    this.drawPile = this.masterDeck.map(c => c.copy());

    // Pull out cards that match the persistent hand (by ID, one per match)
    const handIds = this.hand.map(c => c.id);
    for (const id of handIds) {
      const idx = this.drawPile.findIndex(c => c.id === id);
      if (idx !== -1) this.drawPile.splice(idx, 1);
    }

    // Remove cards equal to discard pile count (persistent damage)
    const dmgCount = this.discardPile.length;
    if (dmgCount > 0 && dmgCount < this.drawPile.length) {
      this.drawPile.splice(this.drawPile.length - dmgCount, dmgCount);
    } else if (dmgCount >= this.drawPile.length) {
      this.drawPile = [];
    }

    // Clear transient combat piles (hand + discard persist)
    this.damagePile = [];
    this.rechargePile = [];
    this.playPile = [];

    this.shuffleDrawPile();

    // Draw up to hand size (hand may already have cards from persistence)
    const toDraw = Math.max(0, classHandSize - this.hand.length);
    return this.draw(toDraw, maxHandSize);
  }

  isInCombat() {
    return this.drawPile.length > 0 || this.hand.length > 0 ||
      this.rechargePile.length > 0 || this.playPile.length > 0;
  }

  // Set up a draw pile for exploration (no hand drawn).
  // Called so non-combat damage (iron door etc.) has a pile to pull from.
  initializeForAdventure() {
    if (this.drawPile.length > 0) return;
    this.drawPile = this.masterDeck.map(c => c.copy());
    for (const hc of this.hand) {
      const idx = this.drawPile.findIndex(c => c.id === hc.id);
      if (idx !== -1) this.drawPile.splice(idx, 1);
    }
    const dmgCount = this.discardPile.length;
    if (dmgCount > 0 && dmgCount < this.drawPile.length) {
      this.drawPile.splice(this.drawPile.length - dmgCount, dmgCount);
    } else if (dmgCount >= this.drawPile.length) {
      this.drawPile = [];
    }
    this.playPile = [];
    this.shuffleDrawPile();
  }

  // End combat: draw back up to hand size, then clear transient piles.
  // Hand and discard pile persist for the next combat.
  endCombat(classHandSize = 4, maxHandSize = 10) {
    const toDraw = Math.max(0, classHandSize - this.hand.length);
    this.draw(toDraw, maxHandSize);

    this.drawPile = [];
    this.damagePile = [];
    this.rechargePile = [];
    this.playPile = [];
  }

  // Rebalance: merge hand + deck + discard back into one deck, heal all
  // damage, shuffle, and draw a fresh hand. Used on rest and level-up.
  rebalance(classHandSize = 4, maxHandSize = 10) {
    this.hand = [];
    this.discardPile = [];
    this.drawPile = this.masterDeck.map(c => c.copy());
    this.damagePile = [];
    this.rechargePile = [];
    this.playPile = [];
    this.shuffleDrawPile();
    return this.draw(classHandSize, maxHandSize);
  }

  draw(count = 1, maxHandSize = 10) {
    const drawn = [];
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    for (let i = 0; i < count; i++) {
      if (this.hand.length >= maxHandSize) break;
      if (this.drawPile.length === 0) break;
      const card = this.drawPile.pop();
      // Tag for draw animation: each card staggers 80 ms so they visually
      // arrive one-by-one from the deck. The renderer in main.js checks
      // _drawAnimStart and lerps the card from the deck origin to its hand
      // position over DRAW_ANIM_DURATION.
      card._drawAnimStart = now + drawn.length * 80;
      this.hand.push(card);
      drawn.push(card);
    }
    return drawn;
  }

  playCard(card) {
    const idx = this.hand.indexOf(card);
    if (idx === -1) return false;
    this.hand.splice(idx, 1);
    card.exhausted = false;
    this.placeByCost(card);
    return true;
  }

  placeByCost(card) {
    card.exhausted = false;
    switch (card.costType) {
      case 'RECHARGE':
        this.addToRechargePile(card);
        break;
      case 'BANISH':
        this.masterDeck = this.masterDeck.filter(c => c.id !== card.id || c.uid !== card.uid);
        break;
      case 'FREE':
      case 'DISCARD':
      default:
        this.discardPile.push(card);
        break;
    }
  }

  addToRechargePile(card) {
    card.exhausted = false;
    this.rechargePile.push(card);
  }

  banishCard(card) {
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
    if (this.drawPile.length > 0) {
      const card = this.drawPile.pop();
      this.discardPile.push(card);
      return card;
    }
    if (this.rechargePile.length > 0) {
      const card = this.rechargePile.shift();
      this.discardPile.push(card);
      return card;
    }
    return null;
  }

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
    const count = this.rechargePile.length;
    for (const card of this.rechargePile) {
      this.drawPile.unshift(card);
    }
    this.rechargePile = [];
    return count;
  }

  endTurn(classHandSize = 4, maxHandSize = 10) {
    this.flushRechargePile();
    if (this.hand.length >= classHandSize) return [];
    const toDraw = classHandSize - this.hand.length;
    return this.draw(toDraw, maxHandSize);
  }
}
