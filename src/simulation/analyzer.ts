import type { TradeExchange, SymbolHypothesis } from "../types/index.ts";

export function analyzeSymbols(
  trades: TradeExchange[],
  existingHypotheses: SymbolHypothesis[],
): SymbolHypothesis[] {
  if (trades.length < 5) return existingHypotheses;

  const hypotheses = new Map<
    string,
    {
      count: number;
      successes: number;
      resourceFlows: Record<string, number[]>;
    }
  >();

  for (const trade of trades) {
    for (const msg of trade.messages) {
      if (!hypotheses.has(msg.message)) {
        hypotheses.set(msg.message, {
          count: 0,
          successes: 0,
          resourceFlows: {},
        });
      }
      const h = hypotheses.get(msg.message)!;
      h.count++;

      if (trade.accepted) {
        h.successes++;
        const alphaFlow =
          (trade.betaOffer.food || 0) - (trade.alphaOffer.food || 0);
        const waterFlow =
          (trade.betaOffer.water || 0) - (trade.alphaOffer.water || 0);
        const crystalFlow =
          (trade.betaOffer.crystals || 0) - (trade.alphaOffer.crystals || 0);
        const energyFlow =
          (trade.betaOffer.energy || 0) - (trade.alphaOffer.energy || 0);

        if (alphaFlow > 0) {
          h.resourceFlows["food"] = [
            ...(h.resourceFlows["food"] || []),
            alphaFlow,
          ];
        }
        if (waterFlow > 0) {
          h.resourceFlows["water"] = [
            ...(h.resourceFlows["water"] || []),
            waterFlow,
          ];
        }
        if (crystalFlow > 0) {
          h.resourceFlows["crystals"] = [
            ...(h.resourceFlows["crystals"] || []),
            crystalFlow,
          ];
        }
        if (energyFlow > 0) {
          h.resourceFlows["energy"] = [
            ...(h.resourceFlows["energy"] || []),
            energyFlow,
          ];
        }
      }
    }
  }

  const results: SymbolHypothesis[] = [];

  for (const [symbol, data] of hypotheses) {
    if (data.count < 3) continue;

    const confidence = data.successes / data.count;
    let likelyMeaning = "unknown";

    let bestResource = "";
    let bestAvgFlow = 0;

    for (const [resource, flows] of Object.entries(data.resourceFlows)) {
      if (flows.length > 0) {
        const avg = flows.reduce((a, b) => a + b, 0) / flows.length;
        if (avg > bestAvgFlow) {
          bestAvgFlow = avg;
          bestResource = resource;
        }
      }
    }

    if (bestResource && confidence > 0.5) {
      likelyMeaning = `${bestResource} request`;
    } else if (confidence > 0.6) {
      likelyMeaning = "greeting / opening";
    }

    results.push({
      symbol,
      likelyMeaning,
      confidence: Math.round(confidence * 100) / 100,
      evidenceCount: data.count,
    });
  }

  results.sort((a, b) => b.confidence - a.confidence);

  const merged = new Map<string, SymbolHypothesis>();
  for (const h of [...existingHypotheses, ...results]) {
    const existing = merged.get(h.symbol);
    if (!existing || h.evidenceCount > existing.evidenceCount) {
      merged.set(h.symbol, h);
    }
  }

  return Array.from(merged.values()).slice(0, 20);
}
