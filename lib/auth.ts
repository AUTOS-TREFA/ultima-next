import { createServerSupabaseClient } from './supabase/server';

export type UserRole = 'user' | 'sales' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export async function getCurrentUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return profile as UserProfile | null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}

export async function requireSalesOrAdmin() {
  const user = await requireAuth();
  if (!['admin', 'sales'].includes(user.role)) {
    throw new Error('Forbidden: Sales or Admin access required');
  }
  return user;
}

export function hasRole(user: UserProfile | null, ...roles: UserRole[]) {
  if (!user) return false;
  return roles.includes(user.role);
}
