import api from '@/utils/api';
import axios, { type AxiosResponse } from 'axios';
import { ValidationError } from '@/errors/CustomErrors';

export interface CreateBankAccountRequest {
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolderName: string;
  dni: string;
  dniComplement?: string | null;
  alias: string;
}

export interface CreateBankAccountResponse {
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolderName: string;
  alias: string;
  id?: number;
}

export async function createBankAccount(
  payload: CreateBankAccountRequest,
  signal?: AbortSignal
): Promise<CreateBankAccountResponse> {
  try {
    const res = await api.post<
      CreateBankAccountResponse,
      AxiosResponse<CreateBankAccountResponse>
    >('/account-settings/bank-accounts', payload, { signal });
    return res.data;
  } catch (error) {
    console.error('Failed to create bank account', error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 400 && error.response?.data?.extra?.fields) {
        throw new ValidationError(error.response.data.extra.fields);
      }
      if (status === 400) throw new Error('badRequest');
    }
    throw new Error('networkError');
  }
}

export async function deleteBankAccount(
  id: number,
  signal?: AbortSignal
): Promise<void> {
  await api.delete(`/account-settings/bank-accounts/${id}`, { signal });
}
