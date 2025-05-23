import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { PaymentService, Payment } from '../payment.service';

@Component({
  selector: 'app-payment-confirmation',
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-confirmation.component.html',
  styleUrl: './payment-confirmation.component.css'
})
export class PaymentConfirmationComponent implements OnInit {
  payment: Payment | null = null;

  constructor(
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { payment: Payment } | undefined;

    if (state && state.payment) {
      this.payment = state.payment;
    }
  }

  maskCardNumber(cardNumber: string): string {
    return this.paymentService.maskCardNumber(cardNumber);
  }
}
