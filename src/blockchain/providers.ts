export type Side = 'buy' | 'sell';
export type Token = { address: string; symbol?: string; name?: string; price?: number; marketCap?: number; liquidity?: number; volume24h?: number; priceChange24h?: number; risk?: string; explorerUrl?: string; updatedAt?: string };
export type Quote = { tokenAddress: string; side: Side; inputAmount: string; estimatedOutput?: string; slippageBps: number; fee?: string; simulated: boolean; provider: string };
export type TradeResult = { status: 'simulated' | 'submitted' | 'confirmed' | 'failed'; txHash?: string; explorerUrl?: string; message: string };
export interface TradingProvider {
  readonly name: string;
  discover(): Promise<Token[]>;
  getQuote(input: { tokenAddress: string; side: Side; amount: string; slippageBps: number }): Promise<Quote>;
  buy(input: { tokenAddress: string; amount: string; slippageBps: number; walletAddress: string }): Promise<TradeResult>;
  sell(input: { tokenAddress: string; amount: string; slippageBps: number; walletAddress: string }): Promise<TradeResult>;
  getBalance(walletAddress: string): Promise<string | null>;
  getTokenBalance(walletAddress: string, tokenAddress: string): Promise<string | null>;
  getTransactionStatus(txHash: string): Promise<TradeResult>;
}

export class SimulationProvider implements TradingProvider {
  readonly name: string = 'simulation';
  async discover(): Promise<Token[]> { return []; }
  async getQuote(input: { tokenAddress: string; side: Side; amount: string; slippageBps: number }): Promise<Quote> {
    return { tokenAddress: input.tokenAddress, side: input.side, inputAmount: input.amount, estimatedOutput: undefined, slippageBps: input.slippageBps, simulated: true, provider: this.name };
  }
  async buy(_input: { tokenAddress: string; amount: string; slippageBps: number; walletAddress: string }): Promise<TradeResult> { return { status: 'simulated', message: 'Simulation only: no transaction was broadcast.' }; }
  async sell(_input: { tokenAddress: string; amount: string; slippageBps: number; walletAddress: string }): Promise<TradeResult> { return { status: 'simulated', message: 'Simulation only: no transaction was broadcast.' }; }
  async getBalance(): Promise<string | null> { return null; }
  async getTokenBalance(): Promise<string | null> { return null; }
  async getTransactionStatus(): Promise<TradeResult> { return { status: 'simulated', message: 'Simulation transaction.' }; }
}

export class UnconfiguredProvider extends SimulationProvider {
  readonly name = 'unconfigured';
  async discover(): Promise<Token[]> { return []; }
  async getQuote(input: { tokenAddress: string; side: Side; amount: string; slippageBps: number }): Promise<Quote> { return { tokenAddress: input.tokenAddress, side: input.side, inputAmount: input.amount, slippageBps: input.slippageBps, simulated: true, provider: this.name }; }
}
