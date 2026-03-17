import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Charts = ({ type, data: sourceData }) => {
  if (type === 'attendance') {
    const trend = sourceData || [];
    const data = {
      labels: trend.map(t => t.date),
      datasets: [
        {
          label: 'Employees Present',
          data: trend.map(t => t.present),
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderRadius: 6,
        }
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    };

    return <Bar options={options} data={data} />;
  }

  if (type === 'leaves') {
    const dist = sourceData || [];
    const data = {
      labels: dist.map(d => d.leave_type),
      datasets: [
        {
          label: '# of Leaves',
          data: dist.map(d => d.count),
          backgroundColor: [
            'rgba(99, 102, 241, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(244, 63, 94, 0.8)',
          ],
          borderWidth: 0,
        },
      ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: { position: 'bottom' }
        }
    }

    return <Doughnut data={data} options={options} />;
  }

  return null;
};

export default Charts;
