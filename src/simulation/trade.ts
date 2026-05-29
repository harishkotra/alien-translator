import type { Civilization, Resources, TradeOffer } from "../types/index.ts";

function resourceSum(r: Resources): number {
  return r.food + r.water + r.crystals + r.energy;
}

export function computeOfferNeed(civ: Civilization): Resources {
  const total = resourceSum(civ);
  if (total === 0) return { food: 25, water: 25, crystals: 25, energy: 25 };
  const need: Resources = {
    food: Math.max(0, 200 - civ.food),
    water: Math.max(0, 200 - civ.water),
    crystals: Math.max(0, 200 - civ.crystals),
    energy: Math.max(0, 200 - civ.energy),
  };
  const needTotal = resourceSum(need);
  if (needTotal === 0) return { food: 10, water: 10, crystals: 10, energy: 10 };
  return need;
}

export function computeOfferSurplus(civ: Civilization): Resources {
  return {
    food: Math.max(0, civ.food - 50),
    water: Math.max(0, civ.water - 50),
    crystals: Math.max(0, civ.crystals - 50),
    energy: Math.max(0, civ.energy - 50),
  };
}

export function generateTradeOffer(civ: Civilization): {
  offer: TradeOffer;
  request: TradeOffer;
} {
  const need = computeOfferNeed(civ);
  const surplus = computeOfferSurplus(civ);

  const offer: TradeOffer = {};
  const request: TradeOffer = {};

  const resourceTypes = ["food", "water", "crystals", "energy"] as const;

  for (const r of resourceTypes) {
    if (surplus[r] > 0 && Math.random() > 0.3) {
      offer[r] = Math.ceil(surplus[r] * (0.1 + Math.random() * 0.3));
    }
  }

  for (const r of resourceTypes) {
    if (need[r] > 0 && Math.random() > 0.3) {
      request[r] = Math.ceil(need[r] * (0.1 + Math.random() * 0.3));
    }
  }

  if (Object.keys(offer).length === 0) offer.food = 5;
  if (Object.keys(request).length === 0) request.water = 5;

  return { offer, request };
}

export function computeTradeUtility(
  alpha: Civilization,
  beta: Civilization,
  alphaOffer: TradeOffer,
  betaOffer: TradeOffer,
  accepted: boolean,
): { alphaUtility: number; betaUtility: number } {
  if (!accepted) return { alphaUtility: -2, betaUtility: -2 };

  const alphaBefore = resourceSum(alpha);
  const betaBefore = resourceSum(beta);

  const applyOffer = (offer: TradeOffer, sign: number): number => {
    let total = 0;
    for (const v of Object.values(offer)) {
      total += v * sign;
    }
    return total;
  };

  const alphaGain = applyOffer(betaOffer, 1) - applyOffer(alphaOffer, 1);
  const betaGain = applyOffer(alphaOffer, 1) - applyOffer(betaOffer, 1);

  const alphaBase = alphaBefore > 0 ? alphaGain / alphaBefore : 0;
  const betaBase = betaBefore > 0 ? betaGain / betaBefore : 0;

  return {
    alphaUtility: Math.round((alphaBase * 100 + 5) * 10) / 10,
    betaUtility: Math.round((betaBase * 100 + 5) * 10) / 10,
  };
}

export function executeTrade(
  alpha: Civilization,
  beta: Civilization,
  alphaOffer: TradeOffer,
  betaOffer: TradeOffer,
): void {
  for (const [key, v] of Object.entries(alphaOffer)) {
    const k = key as keyof Resources;
    alpha[k] -= v!;
    beta[k] += v!;
  }
  for (const [key, v] of Object.entries(betaOffer)) {
    const k = key as keyof Resources;
    beta[k] -= v!;
    alpha[k] += v!;
  }

  alpha.food = Math.max(0, alpha.food);
  alpha.water = Math.max(0, alpha.water);
  alpha.crystals = Math.max(0, alpha.crystals);
  alpha.energy = Math.max(0, alpha.energy);
  beta.food = Math.max(0, beta.food);
  beta.water = Math.max(0, beta.water);
  beta.crystals = Math.max(0, beta.crystals);
  beta.energy = Math.max(0, beta.energy);
}
