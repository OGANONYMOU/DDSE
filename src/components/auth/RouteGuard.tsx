import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';
import type { Permission, DeckId } from '../../lib/rbac';

interface RouteGuardProps {
  children: ReactNode;
  permission?: Permission;
  deck?: DeckId;
  minClearance?: number;
}

export default function RouteGuard({ children, permission, deck, minClearance }: RouteGuardProps) {
  const { can, canAccessDeck, clearance } = usePermission();

  const permitted =
    (!permission || can(permission)) &&
    (!deck || canAccessDeck(deck)) &&
    (!minClearance || clearance >= minClearance);

  if (!permitted) return <Navigate to="/access-denied" replace />;
  return <>{children}</>;
}
