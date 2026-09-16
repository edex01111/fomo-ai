import { describe, expect, it } from 'vitest';
import { SimulationProvider } from '../src/blockchain/providers.js';
describe('SimulationProvider', () => { it('never broadcasts a buy', async () => { const result = await new SimulationProvider().buy({ tokenAddress: 'token', amount: '1', slippageBps: 100, walletAddress: 'wallet' }); expect(result.status).toBe('simulated'); expect(result.txHash).toBeUndefined(); }); it('does not fabricate discovery data', async () => { expect(await new SimulationProvider().discover()).toEqual([]); }); });
