import React, { useState, useRef, useEffect } from 'react';
import { useTheme2, Input, Button } from '@grafana/ui';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export const ChatPanel: React.FC = () => {
  const theme = useTheme2();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 👇 Ref for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 👇 Auto-scroll when messages or typing changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await response.json();

      const botMessage: Message = {
        sender: 'bot',
        text: data.reply || 'No response',
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Error connecting to backend' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // 👇 Enter to send (Shift+Enter optional)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        background: theme.colors.background.primary,
        color: theme.colors.text.primary,
        padding: theme.spacing(2),
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Chat Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: theme.colors.background.secondary,
          padding: theme.spacing(2),
          borderRadius: theme.shape.radius.default,
          marginBottom: theme.spacing(2),
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent:
                msg.sender === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: theme.spacing(1),
            }}
          >
            <div
              style={{
                background:
                  msg.sender === 'user'
                    ? theme.colors.primary.main
                    : theme.colors.background.primary,
                color:
                  msg.sender === 'user'
                    ? theme.colors.text.maxContrast
                    : theme.colors.text.primary,
                border:
                  msg.sender === 'bot'
                    ? `1px solid ${theme.colors.border.weak}`
                    : 'none',
                padding: theme.spacing(1),
                borderRadius: 8,
                maxWidth: '70%',
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* 🔵 Animated Typing Indicator */}
        {isTyping && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: theme.spacing(1),
            }}
          >
            <div
              style={{
                background: theme.colors.background.primary,
                border: `1px solid ${theme.colors.border.weak}`,
                padding: theme.spacing(1),
                borderRadius: 8,
                display: 'flex',
                gap: '4px',
              }}
            >
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: theme.colors.text.secondary,
                    display: 'inline-block',
                    animation: `bounce 1.4s infinite ease-in-out`,
                    animationDelay: `${dot * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 👇 Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          display: 'flex',
          gap: theme.spacing(1),
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>

      {/* 👇 Animation Styles */}
      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};