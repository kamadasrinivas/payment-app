import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaymentService } from '../payment.service';
import { Payment } from '../models/payment.model';

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
}
