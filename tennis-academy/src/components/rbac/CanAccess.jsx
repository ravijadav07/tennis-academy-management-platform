import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../config/roles';

export default function CanAccess({ permission, role, children, fallback }) {
  const { user } = useAuth();

  if (!user) {
    return fallback ?? <Navigate to="/login" replace />;
  }

  if (role) {
    // ops_head can access admin-level operational pages
    const allowed = user.role === role || (role === 'admin' && user.role === 'ops_head');
    if (!allowed) {
      return fallback ?? <Navigate to="/unauthorized" replace />;
    }
  }

  if (permission && !hasPermission(user.role, permission)) {
    return null;
  }

  return children;
}