import { Download, FileSpreadsheet, FileImage } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { VisitorData } from '../types/restaurant';

interface ExportButtonsProps {
  currentView: 'daily' | 'hourly' | 'analysis';
  data: VisitorData[];
}

export function ExportButtons({ currentView, data }: ExportButtonsProps) {
  const exportAsPDF = async () => {
    try {
      const element = document.querySelector('main');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`restaurant-analytics-${currentView}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const exportAsImage = async () => {
    try {
      const charts = document.querySelectorAll('canvas');
      if (charts.length === 0) return;

      const timestamp = new Date().toISOString().split('T')[0];
      
      // If there's only one chart
      if (charts.length === 1) {
        const link = document.createElement('a');
        link.download = `restaurant-chart-${currentView}-${timestamp}.png`;
        link.href = charts[0].toDataURL('image/png');
        link.click();
        return;
      }

      // If there are multiple charts, combine them
      const container = document.createElement('div');
      container.style.backgroundColor = 'white';
      container.style.padding = '20px';
      
      for (const chart of charts) {
        const img = document.createElement('img');
        img.src = chart.toDataURL('image/png');
        img.style.marginBottom = '20px';
        img.style.maxWidth = '100%';
        container.appendChild(img);
      }

      document.body.appendChild(container);
      const canvas = await html2canvas(container, {
        scale: 2,
        logging: false,
        backgroundColor: 'white'
      });
      document.body.removeChild(container);

      const link = document.createElement('a');
      link.download = `restaurant-charts-${currentView}-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting images:', error);
      alert('Failed to export images. Please try again.');
    }
  };

  const exportToExcel = () => {
    try {
      let exportData: any[] = [];

      switch (currentView) {
        case 'daily':
          exportData = data.reduce((acc: any[], entry) => {
            const date = entry.timestamp.split(' ')[0];
            const existing = acc.find(item => item.Date === date);
            
            if (existing) {
              existing['Total Visitors'] += entry.enteringVisitors;
              existing['Total Men'] += entry.enteringMen;
              existing['Total Women'] += entry.enteringWomen;
              existing['Total Groups'] += entry.enteringGroups;
              existing['Total Passersby'] += entry.passersby;
            } else {
              acc.push({
                'Date': date,
                'Total Visitors': entry.enteringVisitors,
                'Total Men': entry.enteringMen,
                'Total Women': entry.enteringWomen,
                'Total Groups': entry.enteringGroups,
                'Total Passersby': entry.passersby,
              });
            }
            
            return acc;
          }, []);
          break;

        case 'hourly':
          exportData = data.map(entry => ({
            'Timestamp': entry.timestamp,
            'Entering Visitors': entry.enteringVisitors,
            'Leaving Visitors': entry.leavingVisitors,
            'Entering Men': entry.enteringMen,
            'Leaving Men': entry.leavingMen,
            'Entering Women': entry.enteringWomen,
            'Leaving Women': entry.leavingWomen,
            'Entering Groups': entry.enteringGroups,
            'Leaving Groups': entry.leavingGroups,
            'Passersby': entry.passersby
          }));
          break;

        case 'analysis':
          // For analysis view, export the hourly data of the selected date if available
          const selectedDate = document.querySelector('input[type="text"]')?.value;
          if (selectedDate) {
            exportData = data
              .filter(entry => entry.timestamp.startsWith(selectedDate))
              .map(entry => ({
                'Hour': entry.timestamp.split(' ')[1],
                'Visitors': entry.enteringVisitors,
                'Men': entry.enteringMen,
                'Women': entry.enteringWomen,
                'Groups': entry.enteringGroups,
                'Passersby': entry.passersby,
              }));
          }
          break;
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      XLSX.writeFile(workbook, `restaurant-data-${currentView}-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Failed to export Excel file. Please try again.');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportAsPDF}
        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
        title="Export as PDF"
      >
        <Download className="w-5 h-5" />
      </button>
      <button
        onClick={exportAsImage}
        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
        title="Export charts as image"
      >
        <FileImage className="w-5 h-5" />
      </button>
      <button
        onClick={exportToExcel}
        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
        title="Export to Excel"
      >
        <FileSpreadsheet className="w-5 h-5" />
      </button>
    </div>
  );
}