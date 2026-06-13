import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Report {
  filename: string;
  label: string;
}

@Component({
  selector: 'ds-legacy-statistics',
  imports: [],
  templateUrl: './legacy-statistics.component.html',
  styleUrl: './legacy-statistics.component.scss',
})
export class LegacyStatisticsComponent implements OnInit {
  reports: Report[] = [
    { filename: "report-2024-1.html", label: "2024-1" },
    { filename: "report-2024-2.html", label: "2024-2" },
    { filename: "report-2024-3.html", label: "2024-3" },
    { filename: "report-2024-4.html", label: "2024-4" },
    { filename: "report-2024-5.html", label: "2024-5" },
    { filename: "report-2024-6.html", label: "2024-6" },
    { filename: "report-2024-7.html", label: "2024-7" },
    { filename: "report-2024-8.html", label: "2024-8" },
    { filename: "report-2024-9.html", label: "2024-9" },
    { filename: "report-2024-10.html", label: "2024-10" },
    { filename: "report-2024-11.html", label: "2024-11" },
    { filename: "report-2024-12.html", label: "2024-12" },
    { filename: "report-2025-1.html", label: "2025-1" },
    { filename: "report-2025-2.html", label: "2025-2" },
    { filename: "report-2025-3.html", label: "2025-3" },
    { filename: "report-2025-4.html", label: "2025-4" },
    { filename: "report-2025-5.html", label: "2025-5" },
    { filename: "report-2025-6.html", label: "2025-6" },
    { filename: "report-2025-7.html", label: "2025-7" },
    { filename: "report-2025-8.html", label: "2025-8" },
    { filename: "report-2025-9.html", label: "2025-9" },
    { filename: "report-2025-10.html", label: "2025-10" },
    { filename: "report-2025-11.html", label: "2025-11" },
    { filename: "report-2025-12.html", label: "2025-12" },
    { filename: "report-2026-1.html", label: "2026-1" },
    { filename: "report-general-2024-7-11.html", label: "General 2024-7-11" },
    { filename: "report-general-2024-7-12.html", label: "General 2024-7-12" },
    { filename: "report-general-2024-12-6.html", label: "General 2024-12-6" },
    { filename: "report-general-2025-3-4.html", label: "General 2025-3-4" },
    { filename: "report-general-2025-5-15.html", label: "General 2025-5-15" },
    { filename: "report-general-2025-9-8.html", label: "General 2025-9-8" }
  ];

  selectedReport: Report | null = null;
  selectedReportUrl: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    if (this.reports.length > 0) {
      this.selectReport(this.reports[0]);
    }
  }

  selectReport(report: Report): void {
    this.selectedReport = report;
    const url = `assets/otcloud/reports/${report.filename}`;
    this.selectedReportUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  onIframeLoad(event: Event): void {
    const iframe = event.target as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      try {
        // Adjust the iframe height to match the internal content's scroll height
        const doc = iframe.contentWindow.document;
        const bodyHeight = doc.body ? doc.body.scrollHeight : 0;
        const docHeight = doc.documentElement ? doc.documentElement.scrollHeight : 0;
        const height = Math.max(bodyHeight, docHeight);
        
        // Add a little extra padding to ensure the scrollbar definitely disappears
        iframe.style.height = (height + 20) + 'px';
      } catch (e) {
        // Fallback if cross-origin or other error occurs
        console.error('Could not dynamically resize iframe:', e);
      }
    }
  }
}
