/**
 * A creature that persists on the battlefield.
 */
export class Creature {
  constructor({
    name,
    attack,
    maxHp,
    currentHp = null,
    unpreventable = false,
    armor = 0,
    poisonAttack = false,
    fireAttack = 0,
    iceAttack = 0,
    fireImmune = false,
    attackAll = false,
    multiAttack = 0,
    sentinel = false,
    selfDestruct = false,
    swarm = false,
    bloodfrenzy = 0,
    isCompanion = false,
    endTurnDamage = 0,
    onDeathDamage = 0,
    onDeathFireHits = 0,
    endTurnHealAllies = 0,
    endTurnShieldAllies = 0,
    endTurnHeroismAllies = 0,
    description = '',
    sourceCard = null,
  }) {
    this.name = name;
    this.attack = attack;
    this.maxHp = maxHp;
    this.currentHp = currentHp !== null ? currentHp : maxHp;

    this.exhausted = true;
    // justSummoned: true on the turn this creature arrives. Cleared when the
    // owner's ready() fires at the start of their next turn. Lets the UI tell
    // the player "can't attack the turn it's summoned" instead of "already attacked".
    this.justSummoned = true;
    this.owner = null;
    this.unpreventable = unpreventable;

    this.armor = armor;
    this.shield = 0;
    this.heroism = 0;
    this.rage = 0;
    this.ignite = 0;

    this.fireStacks = 0;
    this.iceStacks = 0;
    this.poisonStacks = 0;
    this.shockStacks = 0;
    this.markStacks = 0;

    this.poisonAttack = poisonAttack;
    this.fireAttack = fireAttack;
    this.iceAttack = iceAttack;
    this.fireImmune = fireImmune;
    this.attackAll = attackAll;
    this.multiAttack = multiAttack;

    this.sentinel = sentinel;
    this.selfDestruct = selfDestruct;
    this.swarm = swarm;
    this.bloodfrenzy = bloodfrenzy;
    this.isCompanion = isCompanion;

    this.endTurnDamage = endTurnDamage;
    this.onDeathDamage = onDeathDamage;
    this.onDeathFireHits = onDeathFireHits;
    this.endTurnHealAllies = endTurnHealAllies;
    this.endTurnShieldAllies = endTurnShieldAllies;
    this.endTurnHeroismAllies = endTurnHeroismAllies;

    this.description = description;
    this.sourceCard = sourceCard;
    this.slot = -1;
  }

  get isAlive() {
    return this.currentHp > 0;
  }

  takeDamage(amount) {
    // Shield absorbs first
    if (this.shield > 0) {
      const shieldAbsorb = Math.min(this.shield, amount);
      this.shield -= shieldAbsorb;
      amount -= shieldAbsorb;
    }
    // Armor absorbs next
    const absorbed = Math.min(this.armor, amount);
    const actual = amount - absorbed;
    this.currentHp = Math.max(0, this.currentHp - actual);
    return actual;
  }

  takeUnpreventableDamage(amount) {
    this.currentHp = Math.max(0, this.currentHp - amount);
    return amount;
  }

  ready() {
    this.exhausted = false;
    this.justSummoned = false;
  }

  exhaust() {
    this.exhausted = true;
  }

  toString() {
    return `${this.name} (${this.attack}/${this.currentHp})`;
  }
}
