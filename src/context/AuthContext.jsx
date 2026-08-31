// src/context/AuthContext.jsx
// PIN-based mock auth against SEED.users. No email/password, no entity filter.
// Parent accounts synthesized from guardianPhone. 4 roles: admin, ops_head, coach, parent.
// All localStorage persistence goes through DbContext.setSession() — no direct writes.
// Session restored synchronously on init from ata.db.v1 to avoid redirect flash.
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useDb } from './DbContext';
import { db } from '../mocks/localDb';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const { setSession, clearSession, session } = useDb();
  const [user, setUser] = useState(() => db.readSessionSync());

  // Keep user in sync with DbContext on login/logout (NOT on the initial null→restored transition)
  useEffect(() => {
    if (session?.userId) {
      setUser({
        userId: session.userId,
        name: session.name,
        role: session.role,
        linkedCoachId: session.linkedCoachId || null,
        isParent: session.isParent || false,
        guardianPhone: session.guardianPhone || null,
        childrenIds: session.childrenIds || [],
      });
    }
  }, [session]);

  const login = useCallback(async (userId, pin) => {
    const { default: SEED } = await import('../mocks/seedData');
    const u = SEED.users.find((x) => x.id === userId && String(x.pin) === String(pin));
    if (!u) return { success: false, message: 'Invalid credentials' };

    const userData = {
      userId: u.id,
      name: u.name,
      role: u.role === 'OPS_HEAD' ? 'ops_head' : u.role.toLowerCase(),
      linkedCoachId: u.linkedCoachId || null,
      isParent: false,
    };

    setUser(userData);
    setSession({ ...userData, guardianPhone: null, childrenIds: [] });
    return { success: true, user: userData };
  }, [setSession]);

  const loginAsParent = useCallback(async (guardianPhone, pin) => {
    if (String(pin) !== '1234') return { success: false, message: 'Invalid credentials' };

    const { default: SEED } = await import('../mocks/seedData');
    const children = SEED.students.filter((s) => s.guardianPhone === guardianPhone);
    if (!children.length) return { success: false, message: 'No students found for this phone' };

    const userData = {
      userId: 'parent_' + guardianPhone.replace(/\D/g, ''),
      name: children[0].guardianName,
      role: 'parent',
      linkedCoachId: null,
      isParent: true,
      guardianPhone,
      childrenIds: children.map((c) => c.id),
    };

    setUser(userData);
    setSession({ ...userData });
    return { success: true, user: userData };
  }, [setSession]);

  const getStudentsForParent = useCallback(async (parentUser) => {
    if (!parentUser?.isParent) return [];
    const { default: SEED } = await import('../mocks/seedData');
    return SEED.students.filter((s) => parentUser.childrenIds?.includes(s.id));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearSession();
  }, [clearSession]);

  return (
    <AuthCtx.Provider value={{ user, login, loginAsParent, getStudentsForParent, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}