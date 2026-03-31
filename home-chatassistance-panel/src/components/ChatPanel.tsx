import React, { useState, useEffect, useRef } from 'react';

type Message = {
  role: 'user' | 'bot';
  text: string;
};

export const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input;

    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) throw new Error('API failed');

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { role: 'bot', text: data.reply || 'No response' },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'bot', text: '⚠️ Backend not reachable' },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div style={styles.container}>
          <div style={styles.chatBox}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.message,
                  ...(msg.role === 'user' ? styles.user : styles.bot),
                }}
              >
                {msg.text}
              </div>
            ))}
            {loading && <div style={styles.bot}>Typing...</div>}
            <div ref={chatEndRef} />
          </div>

          <div style={styles.inputBox}>
            <input
              style={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleEnter}
              placeholder="Ask about CPU, memory..."
            />
            <button style={styles.button} onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
  );
};

const styles: any = {
  container: { display: 'flex', flexDirection: 'column', height: '100%' },
  chatBox: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px',
    background: '#f4f6f8',
  },
  message: {
    padding: '8px 12px',
    borderRadius: '12px',
    marginBottom: '8px',
    maxWidth: '75%',
  },
  user: {
    alignSelf: 'flex-end',
    background: '#007bff',
    color: '#fff',
  },
  bot: {
    alignSelf: 'flex-start',
    background: '#e4e6eb',
  },
  inputBox: {
    display: 'flex',
    borderTop: '1px solid #ccc',
    padding: '8px',
  },
  input: { flex: 1, padding: '8px' },
  button: {
    marginLeft: '8px',
    padding: '8px 16px',
    background: '#28a745',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
};