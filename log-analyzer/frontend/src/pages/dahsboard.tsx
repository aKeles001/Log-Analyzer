import { useEffect, useState } from "react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Events } from '@wailsio/runtime';
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const Dashboard = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [authLog, setAuthLog] = useState([]);
  const [ufwLog, setUfwLog] = useState([]);
  const [syslogLog, setSyslogLog] = useState([]);
  // Track aggregated data persistently with localStorage
  const [aggregatedData, setAggregatedData] = useState<{ [key: string]: { critical: number; high: number; info: number; count: number; last_scaned: string } }>(() => {
    // Load from localStorage on initial mount
    try {
      const saved = localStorage.getItem('dashboardAggregatedData');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save to localStorage whenever aggregatedData changes
  useEffect(() => {
    try {
      localStorage.setItem('dashboardAggregatedData', JSON.stringify(aggregatedData));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }, [aggregatedData]);

  useEffect(() => {
    const unsubscribe = Events.On("batchLog", (event) => {
      const data = event.data || event;
      
      if (Array.isArray(data)) {
        setAggregatedData(prevAggregated => {
          const updated = { ...prevAggregated };
          
          data.forEach(log => {
            const source = log?.LogFile || "Unknown";

            if (!updated[source]) {
              updated[source] = { critical: 0, high: 0, info: 0, count: 0, last_scaned: new Date().toISOString() };
            }
            
            const severity = (log?.Severity || log?.Level || "info")?.toLowerCase();
            if (severity === "critical" || severity === "error" || severity === "err") {
              updated[source].critical += 1;
            } else if (severity === "high" || severity === "warning" || severity === "warn") {
              updated[source].high += 1;
            } else {
              updated[source].info += 1;
            }
            
            updated[source].count += 1;
            updated[source].last_scaned = log?.Timestamp || new Date().toISOString();
            
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
          
          const chartDataArray = Object.entries(updated).map(([source, stats]) => ({
            name: source.split('/').pop() || source,
            LogFile: source,
            critical: stats.critical,
            high: stats.high,
            info: stats.info,
            count: stats.count,
            last_scaned: stats.last_scaned,
          }));
          
          setChartData(chartDataArray);
          return updated;
        });
      }
    });

    return () => unsubscribe();
  }, []);
  const chartConfig = {
    critical: {
      label: "Critical",
      color: "#dc2626",
    },
    high: {
      label: "High",
      color: "#ea580c",
    },
    info: {
      label: "Info",
      color: "#16a34a",
    },
  } satisfies ChartConfig;
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
return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Log Severity Distribution</CardTitle>
          <CardDescription>Overview of log severity levels across all log sources</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full h-80">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="info"
                fill="var(--color-info)"
                name="Info"
              />
              <Bar
                dataKey="high"
                fill="var(--color-high)"
                name="High"
              />
              <Bar
                dataKey="critical"
                fill="var(--color-critical)"
                name="Critical"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chartData.map((chart: any, index) => {
          const pieData = [
            { name: "Critical", value: chart.critical, fill: "var(--color-critical)" },
            { name: "High", value: chart.high, fill: "var(--color-high)" },
            { name: "Info", value: chart.info, fill: "var(--color-info)" },
          ].filter(item => item.value > 0);
          
          return (
            <Card key={index} className="flex flex-col">
              <CardHeader className="items-center pb-0">
                <CardTitle className="text-base">{chart.name}</CardTitle>
                <CardDescription>Severity Distribution</CardDescription>
                <div className="w-full mt-4 overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 font-medium text-muted-foreground text-center">
                          Critical
                        </th>
                        <th className="px-3 py-2 font-medium text-muted-foreground text-center">
                          High
                        </th>
                        <th className="px-3 py-2 font-medium text-muted-foreground text-center">
                          Info
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-3 py-2 text-center font-semibold text-red-500">
                          {chart.critical}
                        </td>
                        <td className="px-3 py-2 text-center font-semibold text-orange-500">
                          {chart.high}
                        </td>
                        <td className="px-3 py-2 text-center font-semibold text-green-500">
                          {chart.info}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-0">
                {pieData.length > 0 ? (
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        paddingAngle={2}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
    );
}

export default Dashboard;