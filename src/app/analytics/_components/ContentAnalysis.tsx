'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface ContentAnalysisProps {
  uploadFrequency: Record<string, number>;
  videoDurationDistribution: Record<string, number>;
  videoCategoryDistribution: Record<string, number>;
}

export default function ContentAnalysis({
  uploadFrequency,
  videoDurationDistribution,
  videoCategoryDistribution
}: ContentAnalysisProps) {
  const uploadChartRef = useRef<HTMLCanvasElement>(null);
  const durationChartRef = useRef<HTMLCanvasElement>(null);
  const categoryChartRef = useRef<HTMLCanvasElement>(null);
  
  // Create chart instances
  useEffect(() => {
    let uploadChart: Chart | null = null;
    let durationChart: Chart | null = null;
    let categoryChart: Chart | null = null;
    
    if (uploadChartRef.current) {
      // Sort months chronologically
      const sortedMonths = Object.keys(uploadFrequency).sort();
      const uploadData = sortedMonths.map(month => uploadFrequency[month]);
      
      // Create line chart for upload frequency
      uploadChart = new Chart(uploadChartRef.current, {
        type: 'line',
        data: {
          labels: sortedMonths,
          datasets: [{
            label: 'Videos Uploaded',
            data: uploadData,
            borderColor: '#2cbb5d',
            backgroundColor: 'rgba(44, 187, 93, 0.1)',
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#282828',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#3e3e3e',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
                precision: 0
              }
            }
          }
        }
      });
    }
    
    if (durationChartRef.current) {
      // Order duration categories logically
      const durationOrder = [
        'Under 5 min',
        '5-10 min',
        '10-20 min',
        '20-30 min',
        '30-60 min',
        'Over 60 min'
      ];
      
      // Filter and order the data
      const orderedDurations = durationOrder.filter(dur => videoDurationDistribution[dur] !== undefined);
      const durationData = orderedDurations.map(dur => videoDurationDistribution[dur]);
      
      // Create bar chart for video duration distribution
      durationChart = new Chart(durationChartRef.current, {
        type: 'bar',
        data: {
          labels: orderedDurations,
          datasets: [{
            label: 'Number of Videos',
            data: durationData,
            backgroundColor: [
              'rgba(44, 187, 93, 0.8)',
              'rgba(44, 187, 93, 0.7)',
              'rgba(44, 187, 93, 0.6)',
              'rgba(44, 187, 93, 0.5)',
              'rgba(44, 187, 93, 0.4)',
              'rgba(44, 187, 93, 0.3)'
            ],
            borderColor: '#2cbb5d',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#282828',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#3e3e3e',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
                precision: 0
              }
            }
          }
        }
      });
    }
    
    if (categoryChartRef.current) {
      // Get category data
      const categories = Object.keys(videoCategoryDistribution);
      const categoryData = categories.map(cat => videoCategoryDistribution[cat]);
      
      // Create pie chart for video category distribution
      categoryChart = new Chart(categoryChartRef.current, {
        type: 'pie',
        data: {
          labels: categories,
          datasets: [{
            data: categoryData,
            backgroundColor: [
              'rgba(44, 187, 93, 0.8)',
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(255, 159, 64, 0.8)',
              'rgba(75, 192, 192, 0.8)'
            ],
            borderColor: '#1a1a1a',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: 'rgba(255, 255, 255, 0.7)',
                padding: 20,
                font: {
                  size: 12
                },
                boxWidth: 15
              }
            },
            tooltip: {
              backgroundColor: '#282828',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#3e3e3e',
              borderWidth: 1
            }
          }
        }
      });
    }
    
    // Cleanup function
    return () => {
      uploadChart?.destroy();
      durationChart?.destroy();
      categoryChart?.destroy();
    };
  }, [uploadFrequency, videoDurationDistribution, videoCategoryDistribution]);
  
  return (
    <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-6">
      <h2 className="text-xl font-bold text-white mb-6">Content Analysis</h2>
      
      <div className="space-y-8">
        {/* Upload Frequency Chart */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Upload Frequency</h3>
          <div className="h-64 w-full">
            <canvas ref={uploadChartRef}></canvas>
          </div>
        </div>
        
        {/* Video Duration Distribution Chart */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Video Duration Distribution</h3>
          <div className="h-64 w-full">
            <canvas ref={durationChartRef}></canvas>
          </div>
        </div>
        
        {/* Video Category Distribution Chart */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Category Distribution</h3>
          <div className="h-72 w-full">
            <canvas ref={categoryChartRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
} 