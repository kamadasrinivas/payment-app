import { Routes } from '@angular/router';
import { PaymentFormComponent } from './payment-form/payment-form.component';
import { PaymentHistoryComponent } from './payment-history/payment-history.component';
import { PaymentConfirmationComponent } from './payment-confirmation/payment-confirmation.component';

export const routes: Routes = [
  { path: '', redirectTo: 'payment-form', pathMatch: 'full' },
  { path: 'payment-form', component: PaymentFormComponent },
  { path: 'payment-history', component: PaymentHistoryComponent },
  { path: 'payment-confirmation', component: PaymentConfirmationComponent }
];
