import {Bank} from 'thenewboston';

import {
  ACCOUNTS,
  BANK_TRANSACTIONS,
  BANKS,
  BLOCKS,
  CONFIRMATION_BLOCKS,
  INVALID_BLOCKS,
  VALIDATOR_CONFIRMATION_SERVICES,
  VALIDATORS,
} from '@renderer/constants/actions';

import {
  setBankAccounts,
  setBankAccountsError,
  setBankBanks,
  setBankBanksError,
  setBankBankTransactions,
  setBankBankTransactionsError,
  setBankBlocks,
  setBankBlocksError,
  setBankConfig,
  setBankConfigError,
  setBankConfirmationBlocks,
  setBankConfirmationBlocksError,
  setBankInvalidBlocks,
  setBankInvalidBlocksError,
  setBankValidatorConfirmationServices,
  setBankValidatorConfirmationServicesError,
  setBankValidators,
  setBankValidatorsError,
} from '@renderer/store/banks';
import {
  AppDispatch,
  BankAccount,
  BankConfig,
  BankConfirmationBlock,
  BankTransaction,
  BaseValidator,
  BlockResponse,
  InvalidBlock,
  Node,
  NodeType,
  PaginatedQueryParams,
  RawBankConfig,
  ValidatorConfirmationService,
} from '@renderer/types';
import {fetchBankPaginatedResults, sanitizePortFieldFromRawBankConfig} from '@renderer/utils/api';

export const fetchBankAccounts = (address: string, params: PaginatedQueryParams) => async (dispatch: AppDispatch) => {
  return fetchBankPaginatedResults<BankAccount>(
    address,
    ACCOUNTS,
    params,
    dispatch,
    setBankAccounts,
    setBankAccountsError,
  );
};

export const fetchBankBanks = (address: string, params: PaginatedQueryParams) => async (dispatch: AppDispatch) => {
  return fetchBankPaginatedResults<Node>(address, BANKS, params, dispatch, setBankBanks, setBankBanksError);
};

export const fetchBankBankTransactions = (address: string, params: PaginatedQueryParams) => async (
  dispatch: AppDispatch,
) => {
  return fetchBankPaginatedResults<BankTransaction>(
    address,
    BANK_TRANSACTIONS,
    params,
    dispatch,
    setBankBankTransactions,
    setBankBankTransactionsError,
  );
};

export const fetchBankBlocks = (address: string, params: PaginatedQueryParams) => async (dispatch: AppDispatch) => {
  return fetchBankPaginatedResults<BlockResponse>(address, BLOCKS, params, dispatch, setBankBlocks, setBankBlocksError);
};

export const fetchBankConfig = (address: string) => async (
  dispatch: AppDispatch,
): Promise<{address: string; data?: BankConfig; error?: any}> => {
  try {
    const rawData = await new Bank(address).getConfig();
    const data = sanitizePortFieldFromRawBankConfig(rawData as RawBankConfig);

    if (data.node_type !== NodeType.bank) {
      const errorObject = {address, error: 'Node not a bank'};
      dispatch(setBankConfigError(errorObject));
      return errorObject;
    }

    dispatch(setBankConfig({address, data}));
    return {address, data};
  } catch (error) {
    if (error.message) {
      const errorObject = {address, error: error.message};
      dispatch(setBankConfigError(errorObject));
      return errorObject;
    }
    if (error.response) {
      const errorObject = {address, error: error.response.data};
      dispatch(setBankConfigError(errorObject));
      return errorObject;
    }
    throw error;
  }
};

export const fetchBankConfirmationBlocks = (address: string, params: PaginatedQueryParams) => async (
  dispatch: AppDispatch,
) => {
  return fetchBankPaginatedResults<BankConfirmationBlock>(
    address,
    CONFIRMATION_BLOCKS,
    params,
    dispatch,
    setBankConfirmationBlocks,
    setBankConfirmationBlocksError,
  );
};

export const fetchBankInvalidBlocks = (address: string, params: PaginatedQueryParams) => async (
  dispatch: AppDispatch,
) => {
  return fetchBankPaginatedResults<InvalidBlock>(
    address,
    INVALID_BLOCKS,
    params,
    dispatch,
    setBankInvalidBlocks,
    setBankInvalidBlocksError,
  );
};

export const fetchBankValidatorConfirmationServices = (address: string, params: PaginatedQueryParams) => async (
  dispatch: AppDispatch,
) => {
  return fetchBankPaginatedResults<ValidatorConfirmationService>(
    address,
    VALIDATOR_CONFIRMATION_SERVICES,
    params,
    dispatch,
    setBankValidatorConfirmationServices,
    setBankValidatorConfirmationServicesError,
  );
};

export const fetchBankValidators = (address: string, params: PaginatedQueryParams) => async (dispatch: AppDispatch) => {
  return fetchBankPaginatedResults<BaseValidator>(
    address,
    VALIDATORS,
    params,
    dispatch,
    setBankValidators,
    setBankValidatorsError,
  );
};
