import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// Auto-logout for sales users after 3 hours of inactivity
const INACTIVITY_TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const WARNING_BEFORE_MS = 5 * 60 * 1000; // 5 minutes warning before logout

const SalesInactivityLogout: React.FC = () => {
    const { isSales, signOut, session } = useAuth();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);
    const hasWarnedRef = useRef(false);

    const handleLogout = useCallback(async () => {
        toast.error('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
        await signOut();
        window.location.href = '/acceder';
    }, [signOut]);

    const showWarning = useCallback(() => {
        if (!hasWarnedRef.current) {
            hasWarnedRef.current = true;
            toast.warning('Tu sesión expirará en 5 minutos por inactividad. Mueve el ratón o presiona una tecla para mantener la sesión activa.', {
                duration: 30000,
            });
        }
    }, []);

    const resetTimer = useCallback(() => {
        // Clear existing timers
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (warningRef.current) {
            clearTimeout(warningRef.current);
        }

        // Reset warning flag
        hasWarnedRef.current = false;

        // Only set timers if user is a sales user and has an active session
        if (isSales && session) {
            // Set warning timer (3 hours - 5 minutes)
            warningRef.current = setTimeout(() => {
                showWarning();
            }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);

            // Set logout timer (3 hours)
            timeoutRef.current = setTimeout(() => {
                handleLogout();
            }, INACTIVITY_TIMEOUT_MS);
        }
    }, [isSales, session, showWarning, handleLogout]);

    useEffect(() => {
        // Only apply to sales users
        if (!isSales || !session) {
            return;
        }

        // Events that indicate user activity
        const activityEvents = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click',
        ];

        // Throttle the reset to avoid too many resets
        let lastActivity = Date.now();
        const THROTTLE_MS = 30000; // Only reset timer every 30 seconds max

        const handleActivity = () => {
            const now = Date.now();
            if (now - lastActivity >= THROTTLE_MS) {
                lastActivity = now;
                resetTimer();
            }
        };

        // Add event listeners
        activityEvents.forEach((event) => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        // Initial timer setup
        resetTimer();

        // Cleanup
        return () => {
            activityEvents.forEach((event) => {
                document.removeEventListener(event, handleActivity);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (warningRef.current) {
                clearTimeout(warningRef.current);
            }
        };
    }, [isSales, session, resetTimer]);

    // This component doesn't render anything
    return null;
};

export default SalesInactivityLogout;
