import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Payment {
  id: string;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  amount: number;
  description: string;
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private paymentsSubject = new BehaviorSubject<Payment[]>([]);
  payments$ = this.paymentsSubject.asObservable();

  constructor() {
    // Load payments from localStorage if available
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

  getPayments(): Observable<Payment[]> {
    return this.payments$;
  }

  processPayment(payment: Payment): void {
    const currentPayments = this.paymentsSubject.value;
    const updatedPayments = [...currentPayments, payment];
    this.paymentsSubject.next(updatedPayments);

    // Save to localStorage
    this.savePaymentsToLocalStorage(updatedPayments);
  }

  private savePaymentsToLocalStorage(payments: Payment[]): void {
    try {
      localStorage.setItem('payments', JSON.stringify(payments));
    } catch (error) {
      console.error('Error saving payments to localStorage', error);
    }
  }

  // Helper method to mask card number for display
  maskCardNumber(cardNumber: string): string {
    if (!cardNumber) return '';
    return '**** '.repeat(3) + cardNumber.slice(-4);
  }
}
