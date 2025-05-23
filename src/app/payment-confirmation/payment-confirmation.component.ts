import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { PaymentService } from '../payment.service';
import { Payment, PaymentResponse } from '../models/payment.model';

@Component({
  selector: 'app-payment-confirmation',
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-confirmation.component.html',
  styleUrl: './payment-confirmation.component.css'
})
export class PaymentConfirmationComponent implements OnInit {
  payment: Payment | null = null;
  paymentResponse: PaymentResponse | null = null;

  constructor(
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as {
      payment: Payment;
      response: PaymentResponse;
    } | undefined;

    if (state) {
      if (state.payment) {
        this.payment = state.payment;
      }

      if (state.response) {
        this.paymentResponse = state.response;
      }
    }
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
      default: return paymentMethod;
    }
  }
}
