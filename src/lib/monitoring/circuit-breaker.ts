/**
 * Circuit breaker state machine for health monitoring.
 *
 * Pure logic module -- no DB calls. Caller manages persistence.
 * Implements the standard circuit breaker pattern:
 *   CLOSED (normal) -> OPEN (tripped) -> HALF_OPEN (probe) -> CLOSED
 *
 * @module circuit-breaker
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerInput {
	circuitState: CircuitState;
	consecutiveFailures: number;
	circuitOpenedAt: Date | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Max consecutive failures before tripping the circuit. */
export const MAX_CONSECUTIVE_FAILURES = 3;

/** Cooldown period in ms before trying again (30 minutes). */
export const CIRCUIT_COOLDOWN_MS = 30 * 60 * 1000;

// ---------------------------------------------------------------------------
// State transition functions
// ---------------------------------------------------------------------------

/**
 * Determine if a restart should be attempted for a VPS.
 * Returns true if the circuit allows a restart attempt.
 */
export function shouldAttemptRestart(input: CircuitBreakerInput): boolean {
	if (input.circuitState === 'closed') return true;
	if (input.circuitState === 'open') {
		// Check if cooldown has expired -> transition to half_open
		if (input.circuitOpenedAt) {
			const elapsed = Date.now() - input.circuitOpenedAt.getTime();
			if (elapsed >= CIRCUIT_COOLDOWN_MS) return true; // will become half_open
		}
		return false;
	}
	if (input.circuitState === 'half_open') return true;
	return false;
}

/**
 * Get the next circuit state after a failure.
 */
export function getStateAfterFailure(input: CircuitBreakerInput): {
	circuitState: CircuitState;
	consecutiveFailures: number;
	circuitOpenedAt: Date | null;
	tripped: boolean; // true if circuit just transitioned to open
} {
	const newFailures = input.consecutiveFailures + 1;

	if (input.circuitState === 'half_open') {
		// Failed during half_open probe -> back to open
		return {
			circuitState: 'open',
			consecutiveFailures: newFailures,
			circuitOpenedAt: new Date(),
			tripped: false // was already tripped before
		};
	}

	if (newFailures >= MAX_CONSECUTIVE_FAILURES) {
		// Trip the circuit
		return {
			circuitState: 'open',
			consecutiveFailures: newFailures,
			circuitOpenedAt: new Date(),
			tripped: true
		};
	}

	return {
		circuitState: 'closed',
		consecutiveFailures: newFailures,
		circuitOpenedAt: input.circuitOpenedAt,
		tripped: false
	};
}

/**
 * Get the next circuit state after a success.
 */
export function getStateAfterSuccess(input: CircuitBreakerInput): {
	circuitState: CircuitState;
	consecutiveFailures: number;
	circuitOpenedAt: null;
	recovered: boolean; // true if transitioning from non-closed to closed
} {
	const wasDown = input.circuitState !== 'closed' || input.consecutiveFailures > 0;
	return {
		circuitState: 'closed',
		consecutiveFailures: 0,
		circuitOpenedAt: null,
		recovered: wasDown
	};
}

/**
 * Determine the effective circuit state, accounting for cooldown expiry.
 * If circuit is open and cooldown expired, returns 'half_open'.
 */
export function getEffectiveCircuitState(input: CircuitBreakerInput): CircuitState {
	if (input.circuitState === 'open' && input.circuitOpenedAt) {
		const elapsed = Date.now() - input.circuitOpenedAt.getTime();
		if (elapsed >= CIRCUIT_COOLDOWN_MS) return 'half_open';
	}
	return input.circuitState;
}

/**
 * Reset a circuit breaker back to the initial closed state.
 * Used for manual admin resets.
 */
export function resetCircuitBreaker(): {
	circuitState: CircuitState;
	consecutiveFailures: number;
	circuitOpenedAt: null;
} {
	return {
		circuitState: 'closed',
		consecutiveFailures: 0,
		circuitOpenedAt: null
	};
}
