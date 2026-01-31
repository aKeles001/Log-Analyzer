import React, { useEffect, useState } from 'react';
import { Events } from '@wailsio/runtime';
import { Button } from "@/components/ui/button";
import { ThemeProvider } from '../components/theme-provider';
import { Download } from 'lucide-react';
import { ExportLogs } from '../../bindings/log-analyzer/app';
import { toast } from "sonner"

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
  const [exportLoading, setExportLoading] = useState(null);
  //const [nginxLog, setNginxLog] = useState([]); After adding Nginx log parser

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

  useEffect(() => {
    const unsubscribe = Events.On("criticalLog", (event) => {
      const log = event.data || event;
      toast.error(
        `CRITICAL: ${log.Message || "No Message"} in ${log.Source || "Unknown"}`,
        {
          description: new Date(log.Timestamp).toLocaleString(),
          duration: 5000,
        }
      );
    });

    return () => unsubscribe();
  }, []);

  const handleExport = async (logFile, logName) => {
    setExportLoading(logFile);
    try {
      const result = await ExportLogs(logFile);
      toast.success(`${logName} exported successfully to:\n${result}`);
    } catch (error) {
      toast.error(`Failed to export ${logName}:\n${error}`);
    } finally {
      setExportLoading(null);
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="log-container">
        <div className="feed-section">
          <div className="flex items-center justify-between mb-6 gap-4">
            <h3 className="flex-1 text-lg font-semibold">Auth Log</h3>
            <Button
              onClick={() => handleExport("/var/log/host/auth.log", "Auth Log")}
              disabled={exportLoading !== null}
              className="px-4 py-2 gap-2 whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
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
        <div className="flex items-center justify-between mb-6 gap-4">
          <h3 className="flex-1 text-lg font-semibold">UFW Log</h3>
          <Button
            onClick={() => handleExport("/var/log/host/ufw.log", "UFW Log")}
            disabled={exportLoading !== null}
            className="px-4 py-2 gap-2 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
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
        <div className="flex items-center justify-between mb-6 gap-4">
          <h3 className="flex-1 text-lg font-semibold">Syslog</h3>
          <Button
            onClick={() => handleExport("/var/log/host/syslog", "Syslog")}
            disabled={exportLoading !== null}
            className="px-4 py-2 gap-2 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
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
    </ThemeProvider>
  );
};

export default LiveLogFeed;