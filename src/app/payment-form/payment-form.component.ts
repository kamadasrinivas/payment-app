import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../payment.service';

@Component({
  selector: 'app-payment-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css'
})
export class PaymentFormComponent implements OnInit {
  paymentForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.paymentForm = this.fb.group({
      cardholderName: ['', [Validators.required]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['']
    });
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      const paymentData = {
        ...this.paymentForm.value,
        date: new Date(),
        id: Date.now().toString()
      };

      this.paymentService.processPayment(paymentData);
      this.router.navigate(['/payment-confirmation'], { state: { payment: paymentData } });
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
