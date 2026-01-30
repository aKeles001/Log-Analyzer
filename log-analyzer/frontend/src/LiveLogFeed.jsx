import React, { useEffect, useState } from 'react';
import { Events } from '@wailsio/runtime';
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const LiveLogFeed = () => {
  const [authLog, setAuthLog] = useState([]);
  const [ufwLog, setUfwLog] = useState([]);
  const [syslogLog, setSyslogLog] = useState([]);

  useEffect(() => {
    const unsubscribe = Events.On("batchLog", (event) => {
      const data = event.data || event;
      
      if (Array.isArray(data)) {
        data.forEach(log => {
          const source = log?.LogFile || "Unknown";
          
          if (source === "/var/log/host/auth.log") {
            setAuthLog(prev => [...prev, log].slice(-100));
          }
          if (source === "/var/log/host/ufw.log") {
            setUfwLog(prev => [...prev, log].slice(-100));
          }
          if (source === "/var/log/host/syslog") {
            setSyslogLog(prev => [...prev, log].slice(-100));
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
      <div className="log-container">
        <div className="feed-section">
          <h3>Auth Log</h3>
          <div className="log-feed">
            {authLog.map((log, i) => (
              <div key={i} className={`log-line level-${log?.Level?.toLowerCase() || 'info'}`}>
                <span className="timestamp">
                  {log?.Timestamp ? new Date(log.Timestamp).toLocaleTimeString() : "00:00"}
                </span>
                <span className="source">{log?.Source || "Unknown"}</span>
                <span className="message">[{log?.Message || "No Message"}]</span>
                <span className="level">{log?.Level || "INFO"}</span>
              </div>
            ))}
          </div>
        </div>

      <div className="feed-section">
        <h3>UFW Log</h3>
        <div className="log-feed">
          {ufwLog.map((log, i) => (
            <div key={i} className={`log-line level-${log?.Level?.toLowerCase() || 'info'}`}>
              <span className="timestamp">
                {log?.Timestamp ? new Date(log.Timestamp).toLocaleTimeString() : "00:00"}
              </span>
              <span className="source">{log?.Source || "Unknown"}</span>
              <span className="message">[{log?.Message || "No Message"}]</span>
              <span className="level">{log?.Level || "INFO"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="feed-section">
        <h3>Syslog</h3>
        <div className="log-feed">
          {syslogLog.map((log, i) => (
            <div key={i} className={`log-line level-${log?.Level?.toLowerCase() || 'info'}`}>
              <span className="timestamp">
                {log?.Timestamp ? new Date(log.Timestamp).toLocaleTimeString() : "00:00"}
              </span>
              <span className="source">{log?.Source || "Unknown"}</span>
              <span className="message">[{log?.Message || "No Message"}]</span>
              <span className="level">{log?.Level || "INFO"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveLogFeed;