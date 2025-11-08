import { useState, useCallback } from 'react';
import type { Message } from 'types';

const initialMessages: Message[] = [
    { sender: 'ai', text: 'Hallo, apa nih yang bisa saya bantu hari ini? 👋' }
];

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    
    const addMessage = useCallback((message: Message) => {
        setMessages(prev => [...prev, message]);
    }, []);

    const resetChat = useCallback(() => {
        setMessages(initialMessages);
    }, []);

    return { messages, addMessage, resetChat };
};