import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaymentService } from '../payment.service';
import { Payment } from '../models/payment.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-payment-history',
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-history.component.html',
  styleUrl: './payment-history.component.css'
})
export class PaymentHistoryComponent implements OnInit, OnDestroy {
  // All payments
  payments: Payment[] = [];
  // Pagination variables
  currentPage: number = 1;
  pageSize: number = 5;
  totalPages: number = 1;
  pageSizeOptions: number[] = [5, 10, 20, 50];
  // PDF export loading state
  isExporting: boolean = false;

  private subscription: Subscription | null = null;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.subscription = this.paymentService.getPayments().subscribe(payments => {
      this.payments = payments.sort((a, b) => b.date.getTime() - a.date.getTime());
      this.calculateTotalPages();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Calculate total pages based on payments length and page size
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.payments.length / this.pageSize);
    // Ensure current page is valid
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
  }

  // Get payments for the current page
  get paginatedPayments(): Payment[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.payments.slice(startIndex, endIndex);
  }

  // Pagination methods
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  changePageSize(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.pageSize = Number(selectElement.value);
    this.calculateTotalPages();
    // Reset to first page when changing page size
    this.currentPage = 1;
  }

  // Get array of page numbers for pagination controls
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  maskCardNumber(cardNumber: string | undefined): string {
    return this.paymentService.maskCardNumber(cardNumber || '');
  }

  getPaymentMethodName(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'creditCard': return 'Credit Card';
      case 'paypal': return 'PayPal';
      case 'razorpay': return 'RazorPay';
      case 'netbanking': return 'Net Banking';
      default: return paymentMethod || 'Credit Card'; // Default for backward compatibility
    }
  }

  // Export payment history as PDF
  exportAsPDF(exportAll: boolean = false): void {
    // Don't proceed if there are no payments
    if (this.payments.length === 0) {
      return;
    }

    // Set exporting flag to show loading indicator
    this.isExporting = true;

    // Use setTimeout to allow UI to update before starting the PDF generation
    setTimeout(() => {
      try {
        // Create a new jsPDF instance (portrait, mm, A4)
        const doc = new jsPDF();

        // Set title
        doc.setFontSize(18);
        doc.text('Payment History', 105, 15, { align: 'center' });
        doc.setFontSize(12);

        // Get payments to export (either current page or all)
        const paymentsToExport = exportAll ? this.payments : this.paginatedPayments;

        // Start y position for content
        let y = 25;

        // Add export date
        const exportDate = new Date().toLocaleString();
        doc.text(`Exported on: ${exportDate}`, 14, y);
        y += 10;

        // Add page info if not exporting all
        if (!exportAll) {
          doc.text(`Page ${this.currentPage} of ${this.totalPages}`, 14, y);
          y += 10;
        } else {
          doc.text(`All Pages (${this.totalPages} pages)`, 14, y);
          y += 10;
        }

        // Add total payments info
        doc.text(`Total Payments: ${paymentsToExport.length}`, 14, y);
        y += 15;

        // Loop through payments and add to PDF
        paymentsToExport.forEach((payment, index) => {
          // Check if we need a new page
          if (y > 270) {
            doc.addPage();
            y = 20;
          }

          // Payment header
          doc.setFillColor(52, 152, 219); // #3498db
          doc.setTextColor(255, 255, 255);
          doc.rect(14, y, 182, 8, 'F');
          doc.text(`Payment #${index + 1} - $${payment.amount.toFixed(2)}`, 16, y + 5);
          y += 10;

          // Reset text color
          doc.setTextColor(0, 0, 0);

          // Payment details
          doc.text(`Date: ${new Date(payment.date).toLocaleString()}`, 16, y);
          y += 6;

          doc.text(`Payment Method: ${this.getPaymentMethodName(payment.paymentMethod)}`, 16, y);
          y += 6;

          // Payment method specific details
          if (payment.paymentMethod === 'creditCard') {
            doc.text(`Cardholder: ${payment.cardholderName || 'N/A'}`, 16, y);
            y += 6;
            doc.text(`Card Number: ${this.maskCardNumber(payment.cardNumber)}`, 16, y);
            y += 6;
          } else if (payment.paymentMethod === 'paypal') {
            doc.text(`PayPal Email: ${payment.paypalEmail || 'N/A'}`, 16, y);
            y += 6;
          } else if (payment.paymentMethod === 'razorpay') {
            doc.text(`RazorPay ID: ${payment.razorpayId || 'N/A'}`, 16, y);
            y += 6;
          } else if (payment.paymentMethod === 'netbanking') {
            doc.text(`Bank: ${payment.bankName || 'N/A'}`, 16, y);
            y += 6;
          }

          doc.text(`Description: ${payment.description || 'No description provided'}`, 16, y);
          y += 6;

          doc.text(`Transaction ID: ${payment.transactionId || 'N/A'}`, 16, y);
          y += 10;

          // Add separator line except for the last payment
          if (index < paymentsToExport.length - 1) {
            doc.setDrawColor(220, 220, 220);
            doc.line(14, y, 196, y);
            y += 10;
          }
        });

        // Save the PDF
        const filename = exportAll ? 'all-payment-history.pdf' : `payment-history-page-${this.currentPage}.pdf`;
        doc.save(filename);
      } catch (error) {
        console.error('Error generating PDF:', error);
        // You could add a user-friendly error message here
      } finally {
        // Reset exporting flag
        this.isExporting = false;
      }
    }, 100); // Small delay to allow UI to update
  }
}
