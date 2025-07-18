import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface StatusChartProps {
  data: Array<{ status: string; count: number }>;
  onStatusClick?: (status: string) => void;
}

export function StatusChart({ data, onStatusClick }: StatusChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const statusLabels = {
      available: "Disponível",
      reserved: "Reservado",
      sold: "Vendido",
    };

    const labels = data.map(item => statusLabels[item.status as keyof typeof statusLabels] || item.status);
    const values = data.map(item => item.count);

    chartInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: ["#4CAF50", "#FF9800", "#424242"],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              font: {
                size: 12,
              },
            },
          },
        },
        onClick: (event, elements) => {
          if (elements.length > 0 && onStatusClick) {
            const elementIndex = elements[0].index;
            const status = data[elementIndex].status;
            onStatusClick(status);
          }
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={chartRef} />;
}

interface SalesChartProps {
  data: Array<{ month: string; sales: number }>;
  onMonthClick?: (month: string) => void;
}

export function SalesChart({ data, onMonthClick }: SalesChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = data.map(item => item.month);
    const values = data.map(item => item.sales);

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Vendas",
          data: values,
          borderColor: "#1976D2",
          backgroundColor: "rgba(25, 118, 210, 0.1)",
          tension: 0.4,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "#f0f0f0",
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
        onClick: (event, elements) => {
          if (elements.length > 0 && onMonthClick) {
            const elementIndex = elements[0].index;
            const month = data[elementIndex].month;
            onMonthClick(month);
          }
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={chartRef} />;
}
