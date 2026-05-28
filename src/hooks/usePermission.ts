import { useAuth } from '../context/AuthContext';
import { hasPermission, canAccessDeck, getClearanceLevel } from '../lib/rbac';
import type { Permission, DeckId } from '../lib/rbac';

export function usePermission() {
  const { user } = useAuth();

  return {
    can:          (p: Permission)  => hasPermission(user.roleCode, p),
    canAccessDeck:(d: DeckId)      => canAccessDeck(user.roleCode, d),
    clearance:    getClearanceLevel(user.roleCode),
    roleCode:     user.roleCode,
    isPlatformOwner: user.isPlatformOwner ?? false,
  };
}
