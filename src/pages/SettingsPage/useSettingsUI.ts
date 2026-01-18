import { useState, useCallback } from 'react';

export type MessageType = 'success' | 'error';

export interface UIMessage {
    type: MessageType;
    text: string;
}

export const useSettingsUI = () => {
    const [message, setMessage] = useState<UIMessage | null>(null);

    const showMessage = useCallback((type: MessageType, text: string, duration = 3000) => {
        setMessage({ type, text });
        const timer = setTimeout(() => setMessage(null), duration);
        return () => clearTimeout(timer);
    }, []);

    const dismissMessage = useCallback(() => {
        setMessage(null);
    }, []);

    return {
        message,
        setMessage,
        showMessage,
        dismissMessage,
    };
};
