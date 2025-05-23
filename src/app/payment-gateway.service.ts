import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Payment, PaymentResponse } from './models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentGatewayService {
  constructor() { }

  /**
   * Process a payment through the payment gateway
   * This is a simulated payment gateway that returns a success response after a delay
   * In a real application, this would make an API call to a payment processor
   */
  processPayment(payment: Payment): Observable<PaymentResponse> {
    // Simulate API call with a delay
    return of(this.simulatePaymentProcessing(payment)).pipe(
      delay(1500) // Simulate network delay
    );
  }

  private simulatePaymentProcessing(payment: Payment): PaymentResponse {
    // Validate payment details based on payment method
    if (!this.validatePaymentDetails(payment)) {
      return {
        success: false,
        message: `Invalid ${payment.paymentMethod} details. Payment failed.`
      };
    }

    // Simulate a successful payment (95% success rate)
    const isSuccessful = Math.random() < 0.95;

    if (isSuccessful) {
      return {
        success: true,
        transactionId: this.generateTransactionId(payment.paymentMethod),
        message: `Payment processed successfully via ${this.getPaymentMethodName(payment.paymentMethod)}`
      };
    } else {
      return {
        success: false,
        message: this.getFailureMessage(payment.paymentMethod)
      };
    }
  }

  private validatePaymentDetails(payment: Payment): boolean {
    switch (payment.paymentMethod) {
      case 'creditCard':
        return this.validateCreditCardDetails(payment);
      case 'paypal':
        return this.validatePaypalDetails(payment);
      case 'razorpay':
        return this.validateRazorpayDetails(payment);
      case 'netbanking':
        return this.validateNetbankingDetails(payment);
      default:
        return false;
    }
  }

  private validateCreditCardDetails(payment: Payment): boolean {
    // Basic validation for credit card
    const cardNumberValid = payment.cardNumber?.length === 16;
    const expiryDateValid = payment.expiryDate ? /^(0[1-9]|1[0-2])\/\d{2}$/.test(payment.expiryDate) : false;
    const cvvValid = payment.cvv ? /^\d{3,4}$/.test(payment.cvv) : false;

    return !!cardNumberValid && !!expiryDateValid && !!cvvValid;
  }

  private validatePaypalDetails(payment: Payment): boolean {
    // Basic validation for PayPal
    return !!payment.paypalEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payment.paypalEmail);
  }

  private validateRazorpayDetails(payment: Payment): boolean {
    // Basic validation for RazorPay
    return !!payment.razorpayId && payment.razorpayId.length > 5;
  }

  private validateNetbankingDetails(payment: Payment): boolean {
    // Basic validation for NetBanking
    return !!payment.bankName && !!payment.accountNumber && payment.accountNumber.length >= 8;
  }

  private generateTransactionId(paymentMethod: string): string {
    const prefix = this.getTransactionPrefix(paymentMethod);
    return prefix + Math.floor(Math.random() * 1000000000);
  }

  private getTransactionPrefix(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'creditCard': return 'CC';
      case 'paypal': return 'PP';
      case 'razorpay': return 'RP';
      case 'netbanking': return 'NB';
      default: return 'TXN';
    }
  }

  private getPaymentMethodName(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'creditCard': return 'Credit Card';
      case 'paypal': return 'PayPal';
      case 'razorpay': return 'RazorPay';
      case 'netbanking': return 'Net Banking';
      default: return paymentMethod;
    }
  }

  private getFailureMessage(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'creditCard':
        return 'Payment declined by the bank. Please try another card.';
      case 'paypal':
        return 'PayPal payment failed. Please check your PayPal account and try again.';
      case 'razorpay':
        return 'RazorPay payment failed. Please try again later.';
      case 'netbanking':
        return 'Net Banking payment failed. Please check your bank account details and try again.';
      default:
        return 'Payment failed. Please try again.';
    }
  }
}
