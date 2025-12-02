export type Capability = 'registerCompleted' | 'identityVerified' | 'host';

export type PolicyReqs = Partial<Record<Capability, boolean>>;

export type PolicyCheck =
  | { ok: true }
  | { ok: false; reason: Capability; redirectTo: string };

export function checkPolicy(
  userMe: {
    isRegisterCompleted?: boolean;
    identityVerified?: boolean;
    isHost?: boolean;
  } | null,
  reqs: PolicyReqs
): PolicyCheck {
  if (reqs.registerCompleted && !userMe?.isRegisterCompleted) {
    return {
      ok: false,
      reason: 'registerCompleted',
      redirectTo: '/auth',
    };
  }
  if (reqs.host && !userMe?.isHost) {
    return { ok: false, reason: 'host', redirectTo: '/403' };
  }
  return { ok: true };
}
