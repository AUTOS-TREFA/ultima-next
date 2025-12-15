/**
 * Lista centralizada de correos de administradores
 * Estos correos tienen acceso completo al sistema y evitan las politicas RLS
 */
export const ADMIN_EMAILS: string[] = [
    'mariano.morales@autostrefa.mx',
    'marianomorales@outlook.com',
    'marianomorales_@outlook.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'alejandro.gallardo@autostrefa.mx',
    'emmanuel.carranza@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'lizeth.juarez@autostrefa.mx',
];

/**
 * Dominio de correo para admins con acceso por Google OAuth
 */
export const ADMIN_DOMAIN = 'autostrefa.mx';

/**
 * Verifica si un correo electronico es de un administrador
 */
export const isAdminEmail = (email: string | undefined | null): boolean => {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    return ADMIN_EMAILS.includes(normalizedEmail);
};

/**
 * Verifica si un correo electronico pertenece al dominio de administradores
 */
export const isAdminDomain = (email: string | undefined | null): boolean => {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    return normalizedEmail.endsWith(`@${ADMIN_DOMAIN}`);
};

/**
 * Verifica si un usuario es administrador por email o dominio
 */
export const checkIsAdmin = (email: string | undefined | null): boolean => {
    return isAdminEmail(email) || isAdminDomain(email);
};
