import type { SymbolMemory } from "../types/index.ts";

export function createSymbolMemory(): SymbolMemory {
  return {
    usageCount: new Map<string, number>(),
    successCount: new Map<string, number>(),
    lastUsed: new Map<string, number>(),
  };
}

export function recordSymbolUsage(
  memory: SymbolMemory,
  symbols: string,
  success: boolean,
  round: number,
): void {
  const current = memory.usageCount.get(symbols) || 0;
  memory.usageCount.set(symbols, current + 1);
  memory.lastUsed.set(symbols, round);
  if (success) {
    const succ = memory.successCount.get(symbols) || 0;
    memory.successCount.set(symbols, succ + 1);
  }
}

export function getRecentSuccessfulSymbols(
  memory: SymbolMemory,
  round: number,
  windowSize: number = 20,
): string[] {
  const result: string[] = [];
  for (const [symbols, lastRound] of memory.lastUsed) {
    if (round - lastRound <= windowSize) {
      const usage = memory.usageCount.get(symbols) || 0;
      const success = memory.successCount.get(symbols) || 0;
      if (usage > 0 && success / usage > 0.5) {
        result.push(symbols);
      }
    }
  }
  return result;
}

export function getRecentFailedSymbols(
  memory: SymbolMemory,
  round: number,
  windowSize: number = 20,
): string[] {
  const result: string[] = [];
  for (const [symbols, lastRound] of memory.lastUsed) {
    if (round - lastRound <= windowSize) {
      const usage = memory.usageCount.get(symbols) || 0;
      const success = memory.successCount.get(symbols) || 0;
      if (usage > 0 && success / usage <= 0.5) {
        result.push(symbols);
      }
    }
  }
  return result;
}

export function getSymbolSuccessRate(
  memory: SymbolMemory,
  symbols: string,
): number {
  const usage = memory.usageCount.get(symbols) || 0;
  if (usage === 0) return 0;
  const success = memory.successCount.get(symbols) || 0;
  return success / usage;
}
