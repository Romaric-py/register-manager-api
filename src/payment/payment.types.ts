import type { Currency } from '@prisma/client';

export type FedaPayConfig = {
  apiUrl: string;
  currency: string;
  country: string;
  // paymentMethod: string;
};

export type FedaPayHeaders = {
  Authorization: string;
  'Content-Type': string;
};

export type Customer = {
  firstname: string;
  lastname: string;
  email: string;
  phone_number: {
    country: string;
    number: string;
  };
};

export type TransactionData = {
  description: string;
  amount: number;
  currency: { iso: string };
  callback_url: string;
  customer: Customer;
};
