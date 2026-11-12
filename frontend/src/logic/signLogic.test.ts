import { describe, it, expect } from 'vitest';
import { isSignReady, getSignValidationState, VALID_RISK_RATINGS } from './signLogic';

describe('Sign-off Readiness Status Logic', () => {
  const threeFieldsAllDecided = [
    { name: 'Legal Entity Name', decision: 'accepted' },
    { name: 'Beneficial Owner & Holding', decision: 'accepted' },
    { name: 'Director / Controller Identity', decision: 'edited' },
  ];

  const threeFieldsOnePending = [
    { name: 'Legal Entity Name', decision: 'accepted' },
    { name: 'Beneficial Owner & Holding', decision: 'accepted' },
    { name: 'Director / Controller Identity', decision: null },
  ];

  it('keeps sign button disabled when fields have pending decisions and no risk rating', () => {
    const ready = isSignReady(threeFieldsOnePending, null);
    expect(ready).toBe(false);

    const state = getSignValidationState(threeFieldsOnePending, null);
    expect(state.isReady).toBe(false);
    expect(state.pendingCount).toBe(1);
    expect(state.reviewedCount).toBe(2);
    expect(state.message).toContain('1 field decision remaining • Risk rating required');
  });

  it('keeps sign button disabled when fields are all decided but MLRO risk rating is missing', () => {
    const ready = isSignReady(threeFieldsAllDecided, null);
    expect(ready).toBe(false);

    const state = getSignValidationState(threeFieldsAllDecided, '');
    expect(state.isReady).toBe(false);
    expect(state.pendingCount).toBe(0);
    expect(state.message).toBe('MLRO Risk Classification selection required');
  });

  it('keeps sign button disabled when MLRO risk rating is set but a field is still pending', () => {
    const ready = isSignReady(threeFieldsOnePending, 'Low');
    expect(ready).toBe(false);

    const state = getSignValidationState(threeFieldsOnePending, 'Low');
    expect(state.isReady).toBe(false);
    expect(state.pendingCount).toBe(1);
    expect(state.message).toBe('1 field decision remaining');
  });

  it('enables sign button when all fields have explicit decisions (accepted/edited/rejected) and MLRO risk rating is chosen', () => {
    for (const rating of VALID_RISK_RATINGS) {
      const ready = isSignReady(threeFieldsAllDecided, rating);
      expect(ready).toBe(true);

      const state = getSignValidationState(threeFieldsAllDecided, rating);
      expect(state.isReady).toBe(true);
      expect(state.pendingCount).toBe(0);
      expect(state.message).toContain('Ready for AML sign-off');
    }
  });

  it('rejects invalid risk ratings', () => {
    const ready = isSignReady(threeFieldsAllDecided, 'SuperSafe');
    expect(ready).toBe(false);
  });

  it('keeps sign button disabled if no fields exist in case', () => {
    expect(isSignReady([], 'Low')).toBe(false);
  });
});
