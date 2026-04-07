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
  text?: string;
  chart?: any;
  table?: any;
  summary?: string[];
  recommendedQuestions?: string[];
  viz?: any;
  sqlQuery?: string;
  timestamp?: string;
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

  const getTime = () =>
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  // Parse table
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

  // Empty response check
  const isEmptyResponse = (msg: Message) => {
    return (
      (!msg.summary || msg.summary.length === 0) &&
      !msg.chart &&
      !msg.table &&
      (!msg.recommendedQuestions ||
        msg.recommendedQuestions.length === 0)
    );
  };

  // ================== DEV GRAPH BLOCK START ==================

  const getMockGraphMessage = (): Message => ({
    sender: 'bot',
    summary: ['This is a dummy graph for testing'],
    chart: {
      columns: ['name', 'value'],
      rows: [
        ['A', 40],
        ['B', 65],
        ['C', 30],
        ['D', 80],
      ],
    },
    viz: {
      title: 'Dummy Service Metrics',
      xAxis: 'name',
      yAxis: 'value',
    },
    timestamp: getTime(),
  });

  const handleDevShortcuts = (input: string): Message | null => {
    const text = input.toLowerCase().trim();
    if (text === 'show graph') return getMockGraphMessage();
    return null;
  };

  // ================== DEV GRAPH BLOCK END ==================

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      text: input,
      timestamp: getTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // ================== DEV GRAPH USAGE START ==================

    const devResponse = handleDevShortcuts(userMessage.text || '');

    if (devResponse) {
      setTimeout(() => {
        setMessages((prev) => [...prev, devResponse]);
        setIsTyping(false);
      }, 600);
      return;
    }

    // ================== DEV GRAPH USAGE END ==================
    const payload = {
      sessionId: "",
      correlationId: "",
      requestId: "",
      requestType: "",
      question: userMessage.text,
      moduleId: "Usecase_Syncx_Observability",
      clientId: "",
      userInfo: {},
    };
    try {
      const apiResponse = await fetch(
        'http://localhost:5000/api/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await apiResponse.json();

      let botMessage: Message;

      if (data?.response) {
        const tableData = parseTable(data.response.data?.table);
        const chartData = parseTable(data.response.data?.response);

        botMessage = {
          sender: 'bot',
          summary: data.response.summary || [],
          recommendedQuestions:
            data.response.recommended_questions || [],
          table: tableData,
          chart: chartData,
          viz: data.response['viz attributes'] || {},
          sqlQuery: data.response.data?.sql_query,
          timestamp: getTime(),
        };

        if (isEmptyResponse(botMessage)) {
          botMessage.text = 'No data found for your query.';
        }
      } else {
        botMessage = {
          sender: 'bot',
          text: 'Unexpected response from server.',
          timestamp: getTime(),
        };
      }

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Error connecting to backend',
          timestamp: getTime(),
        },
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
    setInput(q); // no auto submit
  };

  const getColor = (value: number) => {
    if (value > 75) return '#ff4d4f';
    if (value > 60) return '#ffc658';
    return '#82ca9d';
  };

  const renderChart = (chartData: any, viz: any) => {
    if (!chartData || !viz || !viz.xAxis || !viz.yAxis)
      return null;

    const formattedData = chartData.rows.map((row: any[]) => {
      const obj: any = {};
      chartData.columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj;
    });

    return (
      <div style={{ width: '100%', height: '250px' }}>
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

  const renderTable = (tableData: any) => {
    if (!tableData) return null;

    return (
      <table
        style={{ width: '100%', borderCollapse: 'collapse' }}
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
  };

  return (
    <div
      style={{
        background: theme.colors.background.primary,
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
          padding: 16,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent:
                msg.sender === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                background:
                  msg.sender === 'user'
                    ? '#3274d9'
                    : theme.colors.background.secondary,
                color:
                  msg.sender === 'user'
                    ? '#fff'
                    : theme.colors.text.primary,
                border:
                  msg.sender === 'bot'
                    ? `1px solid ${theme.colors.border.weak}`
                    : 'none',
                borderRadius: 12,
                padding: 12,
                maxWidth: '60%',
                wordBreak: 'break-word',
              }}
            >
              {/* Header */}
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.6,
                  marginBottom: 6,
                }}
              >
                {msg.sender === 'user' ? '👤 You' : '🤖 Agent'}
              </div>

              {/* Text */}
              {msg.text && (
                <div style={{ marginBottom: 6 }}>{msg.text}</div>
              )}

              {/* Summary */}
              {msg.summary?.map((s, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  • {s}
                </div>
              ))}

              {/* Table */}
              {msg.table && (
                <div
                  style={{
                    marginTop: 8,
                    overflowX: 'auto',
                  }}
                >
                  {renderTable(msg.table)}
                </div>
              )}

              {/* Chart */}
              {msg.chart &&
                renderChart(msg.chart, msg.viz)}

              {/* Suggestions */}
              {msg.recommendedQuestions &&
                msg.recommendedQuestions.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      Try asking:
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginTop: 6,
                      }}
                    >
                      {msg.recommendedQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => sendSuggestion(q)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 14,
                            border: `1px solid ${theme.colors.border.weak}`,
                            background: '#3274d9',
                            //theme.colors.background.primary,
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

              {/* Timestamp */}
              <div
                style={{
                  fontSize: 10,
                  opacity: 0.5,
                  marginTop: 6,
                  textAlign: 'right',
                }}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {/* Typing */}
        {isTyping && (
          <div
            style={{
              marginBottom: 10,
              opacity: 0.6,
            }}
          >
            🤖 Agent is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: 12,
          borderTop: `1px solid ${theme.colors.border.weak}`,
        }}
      >
        {/* Input LEFT */}
        <div style={{ flex: 1 }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
          />
        </div>

        {/* Button RIGHT */}
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
};