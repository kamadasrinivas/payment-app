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

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
}
