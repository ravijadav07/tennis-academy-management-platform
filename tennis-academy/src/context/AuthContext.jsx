import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useDb } from './DbContext';
import { fetchTableData } from '../utils/googleSheets';
import { usersService } from '../services/usersService';
import { db } from '../mocks/localDb';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const { setSession, clearSession, session } = useDb();
  const [user, setUser] = useState(() => db.readSessionSync());

  useEffect(() => {
    if (session?.userId) {
      setUser({
        userId: session.userId,
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        linkedCoachId: session.linkedCoachId || null,
        linkedParentId: session.linkedParentId || null,
        linkedStudentId: session.linkedStudentId || null,
        isParent: session.isParent || false,
        guardianPhone: session.guardianPhone || null,
        childrenIds: session.childrenIds || [],
      });
    }
  }, [session]);

  const login = useCallback(async (identifier, password) => {
    try {
      const authRes = await usersService.authenticate({ identifier, password });
      if (authRes.success && authRes.user) {
        const u = authRes.user;
        let childrenIds = [];
        if (u.role === 'parent') {
          const students = await fetchTableData('students');
          const cleanPhone = String(u.phone || '').replace(/\D/g, '');
          const children = students.filter((s) => {
            const gPhone = String(s.guardianPhone || s.guardian_phone || s.phone || '').replace(/\D/g, '');
            return cleanPhone && gPhone.includes(cleanPhone);
          });
          childrenIds = children.map((c) => c.id);
        }

        const userData = {
          userId: u.userId,
          id: u.userId,
          name: u.name,
          email: u.email,
          role: u.role,
          linkedCoachId: u.linkedCoachId,
          linkedParentId: u.linkedParentId,
          linkedStudentId: u.linkedStudentId,
          isParent: u.role === 'parent',
          guardianPhone: u.phone,
          childrenIds,
        };

        setUser(userData);
        setSession(userData);
        return { success: true, user: userData };
      }
      return { success: false, message: authRes.message || 'Invalid credentials' };
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      return { success: false, message: 'Authentication failed' };
    }
  }, [setSession]);

  const loginAsParent = useCallback(async (guardianPhone, password) => {
    return login(guardianPhone, password);
  }, [login]);

  const getStudentsForParent = useCallback(async (parentUser) => {
    if (!parentUser?.isParent) return [];
    try {
      const students = await fetchTableData('students');
      const cleanPhone = String(parentUser.guardianPhone || parentUser.phone || '').replace(/\D/g, '');
      return students.filter((s) => {
        const gPhone = String(s.guardianPhone || s.guardian_phone || s.phone || '').replace(/\D/g, '');
        return (cleanPhone && gPhone.includes(cleanPhone)) || parentUser.childrenIds?.includes(s.id);
      });
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