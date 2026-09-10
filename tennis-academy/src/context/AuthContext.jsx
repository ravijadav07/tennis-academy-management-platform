// src/context/AuthContext.jsx
// PIN-based mock auth against SEED.users. No email/password, no entity filter.
// Parent accounts synthesized from guardianPhone. 4 roles: admin, ops_head, coach, parent.
// All localStorage persistence goes through DbContext.setSession() — no direct writes.
// Session restored synchronously on init from ata.db.v1 to avoid redirect flash.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useDb } from './DbContext';
import { fetchTableData } from '../utils/googleSheets';
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
    if (String(pin) !== '1234') return { success: false, message: 'Invalid credentials' };

    if (userId === 'user_admin') {
      const userData = { userId: 'user_admin', name: 'Arnav Jain', role: 'admin', linkedCoachId: null, isParent: false };
      setUser(userData);
      setSession({ ...userData, guardianPhone: null, childrenIds: [] });
      return { success: true, user: userData };
    }

    if (userId === 'user_ops') {
      const userData = { userId: 'user_ops', name: 'Ops Head', role: 'ops_head', linkedCoachId: null, isParent: false };
      setUser(userData);
      setSession({ ...userData, guardianPhone: null, childrenIds: [] });
      return { success: true, user: userData };
    }

    try {
      const coaches = await fetchTableData('coaches');
      const c = coaches.find((x) => String(x.id) === String(userId) || String(x.name || x.fullName || '').toLowerCase() === String(userId).toLowerCase());
      if (c) {
        const userData = { userId: c.id, name: c.name || c.fullName || 'Coach', role: 'coach', linkedCoachId: c.id, isParent: false };
        setUser(userData);
        setSession({ ...userData, guardianPhone: null, childrenIds: [] });
        return { success: true, user: userData };
      }
    } catch (e) {}

    return { success: false, message: 'Invalid credentials' };
  }, [setSession]);

  const loginAsParent = useCallback(async (guardianPhone, pin) => {
    if (String(pin) !== '1234') return { success: false, message: 'Invalid credentials' };

    try {
      const students = await fetchTableData('students');
      const cleanPhone = String(guardianPhone || '').replace(/\D/g, '');
      const children = students.filter((s) => String(s.guardianPhone || '').replace(/\D/g, '') === cleanPhone);
      if (!children.length) return { success: false, message: 'No students found for this phone' };

      const parentName = children[0].guardianName || children[0].parentName || 'Parent';
      const userData = {
        userId: 'parent_' + cleanPhone,
        name: parentName,
        role: 'parent',
        linkedCoachId: null,
        isParent: true,
        guardianPhone,
        childrenIds: children.map((c) => c.id),
      };

      setUser(userData);
      setSession({ ...userData });
      return { success: true, user: userData };
    } catch (e) {
      return { success: false, message: 'Login failed' };
    }
  }, [setSession]);

  const getStudentsForParent = useCallback(async (parentUser) => {
    if (!parentUser?.isParent) return [];
    try {
      const students = await fetchTableData('students');
      return students.filter((s) => parentUser.childrenIds?.includes(s.id));
    } catch (e) { return []; }
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