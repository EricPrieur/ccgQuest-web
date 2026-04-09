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

    switch (card.costType) {
      case 'RECHARGE':
        this.drawPile.unshift(card); // bottom of draw pile
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
    if (this.drawPile.length === 0) return null;
    const card = this.drawPile.pop();
    this.damagePile.push(card);
    return card;
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
    this.drawPile.unshift(...this.rechargePile);
    this.rechargePile = [];
    return count;
  }

  endTurn(classHandSize = 4, maxHandSize = 10) {
    this.flushRechargePile();
    return this.draw(classHandSize, maxHandSize);
  }
}
