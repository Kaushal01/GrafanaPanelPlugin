import React, { useState, useRef, useEffect } from 'react';
import { useTheme2, Input, Button } from '@grafana/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Message {
  sender: 'user' | 'bot';
  type?: 'text' | 'chart' | 'table' | 'mixed';
  text?: string;
  chart?: any;
  table?: any;
}

export const ChatPanel: React.FC = () => {
  const theme = useTheme2();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
        type: data.type,
        text: data.reply || data.text,
        chart: data.chart || (data.type === 'chart' ? data : null),
        table: data.table || (data.type === 'table' ? data : null),
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 🚦 Smart color based on value
  const getColor = (value: number) => {
    if (value > 75) return '#ff4d4f'; // red
    if (value > 60) return '#ffc658'; // yellow
    return '#82ca9d'; // green
  };

  // 🔹 Render Chart
  const renderChart = (chartData: any) => {
    if (!chartData?.data) return <div>No chart data</div>;

    return (
      <div style={{ width: '100%', height: '250px' }}>
        {/* ✅ Chart Title */}
        {chartData.title && (
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {chartData.title}
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.data}>
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />

            <Bar dataKey="value">
              {chartData.data.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    // 👉 Choose one:

                    // OPTION 1: Smart coloring (recommended)
                    getColor(entry.value)

                    // OPTION 2: Fixed colorful bars
                    // COLORS[index % COLORS.length]
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // 🔹 Render Table
  const renderTable = (tableData: any) => (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: 8,
      }}
    >
      <thead>
        <tr>
          {tableData.columns.map((col: string, i: number) => (
            <th
              key={i}
              style={{
                border: `1px solid ${theme.colors.border.weak}`,
                padding: 6,
              }}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableData.rows.map((row: any[], i: number) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td
                key={j}
                style={{
                  border: `1px solid ${theme.colors.border.weak}`,
                  padding: 6,
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

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
              {/* TEXT */}
              {msg.text && <div>{msg.text}</div>}

              {/* CHART */}
              {msg.type === 'chart' && msg.chart && renderChart(msg.chart)}

              {/* TABLE */}
              {msg.type === 'table' && msg.table && renderTable(msg.table)}

              {/* MIXED */}
              {msg.type === 'mixed' && (
                <>
                  {msg.text && <div>{msg.text}</div>}
                  {msg.chart && renderChart(msg.chart)}
                  {msg.table && renderTable(msg.table)}
                </>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && <div>Typing...</div>}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: theme.spacing(1) }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
};