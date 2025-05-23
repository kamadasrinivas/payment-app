import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaymentService, Payment } from '../payment.service';

@Component({
  selector: 'app-payment-history',
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-history.component.html',
  styleUrl: './payment-history.component.css'
})
export class PaymentHistoryComponent implements OnInit, OnDestroy {
  payments: Payment[] = [];
  private subscription: Subscription | null = null;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.subscription = this.paymentService.getPayments().subscribe(payments => {
      this.payments = payments.sort((a, b) => b.date.getTime() - a.date.getTime());
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  maskCardNumber(cardNumber: string): string {
    return this.paymentService.maskCardNumber(cardNumber);
  }
}
