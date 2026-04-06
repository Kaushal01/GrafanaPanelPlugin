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
  type?: 'text' | 'chart' | 'table' | 'mixed' | 'agent';
  text?: string;
  chart?: any;
  table?: any;
  summary?: string[];
  recommendedQuestions?: string[];
  viz?: any;
  sqlQuery?: string;
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

  // Parse Table / Chart
  const parseTable = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      return {
        columns: parsed.schema.fields.map((f: any) => f.name),
        rows: parsed.data.map((row: any) =>
          parsed.schema.fields.map((f: any) => row[f.name])
        ),
      };
    } catch {
      return null;
    }
  };

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

      // AGENT HANDLING
      if (data?.response) {
        const tableData = parseTable(data.response.data?.table);
        const chartData = parseTable(data.response.data?.response);

        const botMessage: Message = {
          sender: 'bot',
          type: 'agent',
          summary: data.response.summary,
          recommendedQuestions: data.response.recommended_questions,
          table: tableData,
          chart: chartData,
          viz: data.response.viz_attributes,
          sqlQuery: data.response.data?.sql_query,
        };

        setMessages((prev) => [...prev, botMessage]);

      } else {
        const botMessage: Message = {
          sender: 'bot',
          type: data.type,
          text: data.reply || data.text,
          chart: data.chart || (data.type === 'chart' ? data : null),
          table: data.table || (data.type === 'table' ? data : null),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
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

  const sendSuggestion = (q: string) => {
    setInput(q);
    setTimeout(() => sendMessage(), 100);
  };

  const getColor = (value: number) => {
    if (value > 75) return '#ff4d4f';
    if (value > 60) return '#ffc658';
    return '#82ca9d';
  };

  const renderDynamicChart = (chartData: any, viz: any) => {
    if (!chartData || !viz) return null;

    const formattedData = chartData.rows.map((row: any[]) => {
      const obj: any = {};
      chartData.columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj;
    });

    return (
      <div style={{ width: '100%', height: '250px' }}>
        {viz.title && (
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {viz.title}
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData}>
            <XAxis dataKey={viz.xAxis} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={viz.yAxis}>
              {formattedData.map((entry: any, index: number) => (
                <Cell
                  key={index}
                  fill={getColor(entry[viz.yAxis])}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

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
              {msg.type === 'chart' && msg.chart && renderDynamicChart(msg.chart, msg.viz)}

              {/* TABLE */}
              {msg.type === 'table' && msg.table && renderTable(msg.table)}

              {/* 🔥 AGENT */}
              {msg.type === 'agent' && (
                <>
                  {/* Summary */}
                  {msg.summary && (
                    <div style={{ marginBottom: 10 }}>
                      {msg.summary.map((s, i) => (
                        <div key={i}>• {s}</div>
                      ))}
                    </div>
                  )}

                  {/* Chart */}
                  {msg.chart && msg.viz && renderDynamicChart(msg.chart, msg.viz)}

                  {/* Table */}
                  {msg.table && renderTable(msg.table)}

                  {/* SQL */}
                  {msg.sqlQuery && (
                    <details style={{ marginTop: 8 }}>
                      <summary>View SQL</summary>
                      <pre style={{ fontSize: 11 }}>{msg.sqlQuery}</pre>
                    </details>
                  )}

                  {/* Suggestions */}
                  {msg.recommendedQuestions && (
                    <div style={{ marginTop: 10 }}>
                      <strong>Try asking:</strong>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 6,
                        }}
                      >
                        {msg.recommendedQuestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => sendSuggestion(q)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 16,
                              border: `1px solid ${theme.colors.border.weak}`,
                              background:
                                theme.colors.background.secondary,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

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