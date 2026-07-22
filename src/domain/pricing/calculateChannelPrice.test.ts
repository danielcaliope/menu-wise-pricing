import { describe, expect, it } from "vitest";
import { calculateChannelPrice } from "./calculateChannelPrice";

describe("calculateChannelPrice", () => {
  // Cenário 1: venda sem taxa de marketplace
  it("sem taxa, netRevenue = price", () => {
    const result = calculateChannelPrice({ price: 100 });
    expect(result.feeAmount).toBe(0);
    expect(result.netRevenue).toBe(100);
  });

  it("com fee={} (objeto vazio), também não desconta nada", () => {
    const result = calculateChannelPrice({ price: 100, fee: {} });
    expect(result.netRevenue).toBe(100);
  });

  // Cenário 2: venda com comissão percentual
  it("desconta a comissão percentual do canal", () => {
    const result = calculateChannelPrice({ price: 100, fee: { percentage: 20 } });
    expect(result.feeAmount).toBe(20);
    expect(result.netRevenue).toBe(80);
  });

  // Cenário 3: venda com taxa fixa
  it("desconta a taxa fixa do canal", () => {
    const result = calculateChannelPrice({ price: 100, fee: { fixed: 5 } });
    expect(result.feeAmount).toBe(5);
    expect(result.netRevenue).toBe(95);
  });

  it("combina taxa percentual e fixa no mesmo cálculo", () => {
    const result = calculateChannelPrice({ price: 100, fee: { percentage: 20, fixed: 5 } });
    expect(result.feeAmount).toBe(25);
    expect(result.netRevenue).toBe(75);
  });

  it("preserva o grossPrice original no resultado", () => {
    const result = calculateChannelPrice({ price: 100, fee: { percentage: 20 } });
    expect(result.grossPrice).toBe(100);
  });
});
