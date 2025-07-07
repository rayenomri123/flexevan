import { useState, useEffect } from 'react';
import './Console.css';

const Console = ({ isRunning }) => {
  const [messages, setMessages] = useState([]);

  // Override console methods to capture messages
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;

    // Function to add a message to state
    const addMessage = (type, args) => {
      setMessages((prev) => [
        ...prev,
        { type, message: args.join(' '), timestamp: new Date().toLocaleTimeString() },
      ]);
    };

    // Override console methods
    console.log = (...args) => {
      addMessage('log', args);
      originalConsoleLog(...args);
    };
    console.error = (...args) => {
      addMessage('error', args);
      originalConsoleError(...args);
    };
    console.warn = (...args) => {
      addMessage('warn', args);
      originalConsoleWarn(...args);
    };
    console.info = (...args) => {
      addMessage('info', args);
      originalConsoleInfo(...args);
    };

    // Cleanup to restore original console methods
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
    };
  }, []);

  return (
    <div className="console-container">
      {isRunning && (
        <div className="console-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`console-message console-${msg.type}`}>
              <span className="timestamp">{msg.timestamp}</span> [{msg.type.toUpperCase()}] {msg.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Console;