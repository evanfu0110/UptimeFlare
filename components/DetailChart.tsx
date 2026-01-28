import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  TimeScale,
} from 'chart.js'
import 'chartjs-adapter-moment'
import { MonitorState, MonitorTarget } from '@/types/config'
import { codeToCountry } from '@/util/iata'
import { useTranslation } from 'react-i18next'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  TimeScale
)

export default function DetailChart({
  monitor,
  state,
}: {
  monitor: MonitorTarget
  state: MonitorState
}) {
  const { t } = useTranslation('common')
  const latencyData = state.latency[monitor.id].map((point) => ({
    x: point.time * 1000,
    y: point.ping,
    loc: point.loc,
  }))

  let data = {
    datasets: [
      {
        data: latencyData,
        borderColor: '#70778c',
        backgroundColor: '#70778c',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        cubicInterpolationMode: 'monotone' as const,
        tension: 0.4,
      },
    ],
  }

  let options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    animation: {
      duration: 0,
    },
    plugins: {
      tooltip: {
        backgroundColor: '#21242d',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3f4355',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          label: (item: any) => {
            if (item.parsed.y) {
              return `${item.parsed.y}ms (${codeToCountry(item.raw.loc)})`
            }
          },
        },
      },
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '响应时间',
        align: 'start' as const,
        color: '#8a91a5',
        font: {
          size: 13,
          weight: 'normal'
        },
        padding: {
          bottom: 10
        }
      },
    },
    scales: {
      x: {
        display: false, // Replicating minimal layout
        type: 'time' as const,
      },
      y: {
        display: false, // Replicating minimal layout
      }
    },
  }

  return (
    <div style={{ height: '150px' }}>
      <Line options={options} data={data} />
    </div>
  )
}
