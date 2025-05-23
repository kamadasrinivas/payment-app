import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../payment.service';
import { finalize } from 'rxjs/operators';
import { PaymentResponse } from '../payment-gateway.service';

@Component({
  selector: 'app-payment-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css'
})
export class PaymentFormComponent implements OnInit {
  paymentForm!: FormGroup;
  isProcessing = false;
  paymentError: string | null = null;
  paymentSuccess = false;
  paymentResponse: PaymentResponse | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  // Define payment methods
  paymentMethods = [
    { id: 'creditCard', name: 'Credit Card' },
    { id: 'paypal', name: 'PayPal' },
    { id: 'razorpay', name: 'RazorPay' },
    { id: 'netbanking', name: 'Net Banking' }
  ];

  // Track the currently selected payment method
  selectedPaymentMethod = 'creditCard';

  initForm(): void {
    this.paymentForm = this.fb.group({
      paymentMethod: ['creditCard', [Validators.required]],
      // Credit Card fields
      cardholderName: [''],
      cardNumber: [''],
      expiryDate: [''],
      cvv: [''],
      // PayPal fields
      paypalEmail: [''],
      // RazorPay fields
      razorpayId: [''],
      // NetBanking fields
      bankName: [''],
      accountNumber: [''],
      // Common fields
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['']
    });

    // Update validators when payment method changes
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      this.selectedPaymentMethod = method;
      this.updateValidators(method);
    });

    // Set initial validators
    this.updateValidators('creditCard');
  }

  updateValidators(paymentMethod: string): void {
    // Reset all validators first
    this.resetValidators();

    // Set validators based on payment method
    switch (paymentMethod) {
      case 'creditCard':
        this.paymentForm.get('cardholderName')?.setValidators([Validators.required]);
        this.paymentForm.get('cardNumber')?.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
        this.paymentForm.get('expiryDate')?.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]);
        this.paymentForm.get('cvv')?.setValidators([Validators.required, Validators.pattern(/^\d{3,4}$/)]);
        break;
      case 'paypal':
        this.paymentForm.get('paypalEmail')?.setValidators([Validators.required, Validators.email]);
        break;
      case 'razorpay':
        this.paymentForm.get('razorpayId')?.setValidators([Validators.required, Validators.minLength(6)]);
        break;
      case 'netbanking':
        this.paymentForm.get('bankName')?.setValidators([Validators.required]);
        this.paymentForm.get('accountNumber')?.setValidators([Validators.required, Validators.minLength(8)]);
        break;
    }

    // Update form controls
    Object.keys(this.paymentForm.controls).forEach(key => {
      this.paymentForm.get(key)?.updateValueAndValidity();
    });
  }

  resetValidators(): void {
    // Remove all validators except for common fields
    this.paymentForm.get('cardholderName')?.clearValidators();
    this.paymentForm.get('cardNumber')?.clearValidators();
    this.paymentForm.get('expiryDate')?.clearValidators();
    this.paymentForm.get('cvv')?.clearValidators();
    this.paymentForm.get('paypalEmail')?.clearValidators();
    this.paymentForm.get('razorpayId')?.clearValidators();
    this.paymentForm.get('bankName')?.clearValidators();
    this.paymentForm.get('accountNumber')?.clearValidators();
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      // Reset payment states
      this.isProcessing = true;
      this.paymentError = null;
      this.paymentSuccess = false;
      this.paymentResponse = null;

      const paymentData = {
        ...this.paymentForm.value,
        date: new Date(),
        id: Date.now().toString()
      };

      this.paymentService.processPayment(paymentData)
        .pipe(
          finalize(() => {
            this.isProcessing = false;
          })
        )
        .subscribe({
          next: (response) => {
            this.paymentResponse = response;
            this.paymentSuccess = response.success;

            if (response.success) {
              // Add transaction ID to payment data
              const processedPayment = {
                ...paymentData,
                transactionId: response.transactionId
              };

              // Navigate to confirmation page after a short delay to show success message
              setTimeout(() => {
                this.router.navigate(['/payment-confirmation'], {
                  state: {
                    payment: processedPayment,
                    response: response
                  }
                });
              }, 1500);
            } else {
              this.paymentError = response.message;
            }
          },
          error: (error) => {
            this.paymentError = error.message || 'An unexpected error occurred. Please try again.';
            this.paymentSuccess = false;
          }
        });
    } else {
      this.markFormGroupTouched(this.paymentForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    // Remove any non-digit characters
    const filteredValue = value.replace(/\D/g, '');

    // Only update if the value has changed (to avoid cursor position issues)
    if (value !== filteredValue) {
      this.paymentForm.get('cardNumber')?.setValue(filteredValue);
    }
  }

  onExpiryDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Allow only digits and a single slash
    let filteredValue = value.replace(/[^\d\/]/g, '');

    // Ensure proper MM/YY format
    if (filteredValue.length > 0) {
      // Extract digits only
      const digits = filteredValue.replace(/\D/g, '');

      // Format as MM/YY
      if (digits.length <= 2) {
        filteredValue = digits;
      } else {
        filteredValue = digits.substring(0, 2) + '/' + digits.substring(2, 4);
      }
    }

    // Only update if the value has changed
    if (value !== filteredValue) {
      this.paymentForm.get('expiryDate')?.setValue(filteredValue);
    }
  }

  onCvvInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    // Remove any non-digit characters
    const filteredValue = value.replace(/\D/g, '');

    // Only update if the value has changed
    if (value !== filteredValue) {
      this.paymentForm.get('cvv')?.setValue(filteredValue);
    }
  }
}
