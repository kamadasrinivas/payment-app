import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PaymentGatewayService, PaymentResponse } from './payment-gateway.service';

export interface Payment {
  id: string;
  paymentMethod: string; // 'creditCard', 'paypal', 'razorpay', 'netbanking'
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  // PayPal specific fields
  paypalEmail?: string;
  // RazorPay specific fields
  razorpayId?: string;
  // NetBanking specific fields
  bankName?: string;
  accountNumber?: string;
  // Common fields
  amount: number;
  description: string;
  date: Date;
  transactionId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private paymentsSubject = new BehaviorSubject<Payment[]>([]);
  payments$ = this.paymentsSubject.asObservable();

  constructor(private paymentGatewayService: PaymentGatewayService) {
    // Load payments from localStorage if available and if we're in a browser environment
    if (this.isLocalStorageAvailable()) {
      const savedPayments = localStorage.getItem('payments');
      if (savedPayments) {
        try {
          const parsedPayments = JSON.parse(savedPayments);
          // Convert string dates back to Date objects
          const payments = parsedPayments.map((payment: any) => ({
            ...payment,
            date: new Date(payment.date)
          }));
          this.paymentsSubject.next(payments);
        } catch (error) {
          console.error('Error parsing saved payments', error);
          this.paymentsSubject.next([]);
        }
      }
    }
  }

  // Helper method to check if localStorage is available
  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && window.localStorage !== undefined;
    } catch (e) {
      return false;
    }
  }

  getPayments(): Observable<Payment[]> {
    return this.payments$;
  }

  processPayment(payment: Payment): Observable<PaymentResponse> {
    // Process payment through the payment gateway
    return this.paymentGatewayService.processPayment(payment).pipe(
      tap(response => {
        if (response.success) {
          // Add transaction ID to the payment
          const processedPayment = {
            ...payment,
            transactionId: response.transactionId
          };

          // Add to payment history
          const currentPayments = this.paymentsSubject.value;
          const updatedPayments = [...currentPayments, processedPayment];
          this.paymentsSubject.next(updatedPayments);

          // Save to localStorage
          this.savePaymentsToLocalStorage(updatedPayments);
        }
      }),
      catchError(error => {
        console.error('Error processing payment', error);
        return throwError(() => new Error('Payment processing failed. Please try again.'));
      })
    );
  }

  private savePaymentsToLocalStorage(payments: Payment[]): void {
    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.setItem('payments', JSON.stringify(payments));
      } catch (error) {
        console.error('Error saving payments to localStorage', error);
      }
    }
  }

  // Helper method to mask card number for display
  maskCardNumber(cardNumber: string | undefined): string {
    if (!cardNumber) return '';
    return '**** '.repeat(3) + cardNumber.slice(-4);
  }
}
