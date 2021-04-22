import {Bank, ConfirmationValidator} from 'thenewboston';

import {defaultPaginatedQueryParam} from '@renderer/config';
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
  AppDispatch,
  BankConfig,
  PaginatedQueryParams,
  PaginatedResults,
  RawBankConfig,
  RawValidatorConfig,
  ValidatorConfig,
} from '@renderer/types';

import {SetError, SetResults} from '@renderer/utils/store';
import {PrimaryValidatorInNodeConfig, RawPrimaryValidatorInNodeConfig} from '@renderer/types/network';

export async function fetchBankPaginatedResults<T>(
  address: string,
  action: string,
  queryParams: PaginatedQueryParams,
  dispatch: AppDispatch,
  setResults: SetResults<T>,
  setError: SetError,
) {
  const bank = new Bank(address, {defaultPagination: {...defaultPaginatedQueryParam, offset: 0}});

  let rawData;

  try {
    switch (action) {
      case ACCOUNTS:
        rawData = await bank.getAccounts(queryParams);
        break;

      case BANKS:
        rawData = await bank.getBanks(queryParams);
        break;

      case BANK_TRANSACTIONS:
        rawData = await bank.getTransactions(queryParams);
        break;

      case BLOCKS:
        rawData = await bank.getBlocks(queryParams);
        break;

      case CONFIRMATION_BLOCKS:
        rawData = await bank.getConfirmationBlocks(queryParams);
        break;

      case INVALID_BLOCKS:
        rawData = await bank.getInvalidBlocks(queryParams);
        break;

      case VALIDATOR_CONFIRMATION_SERVICES:
        rawData = await bank.getValidatorConfirmationServices(queryParams);
        break;

      case VALIDATORS:
        rawData = await bank.getValidators(queryParams);
        break;

      default:
        throw new Error('Fetch Bank Pagination Action not Set');
    }

    const data = formatPaginatedData(rawData);

    dispatch(setResults({address, ...data}));
    return data.results;
  } catch (error) {
    if (!error.response) {
      throw error;
    }
    dispatch(setError({address, error: error.response.data}));
  }
}

export async function fetchValidatorPaginatedResults<T>(
  address: string,
  action: string,
  queryParams: PaginatedQueryParams,
  dispatch: AppDispatch,
  setResults: SetResults<T>,
  setError: SetError,
) {
  const validator = new ConfirmationValidator(address, {
    defaultPagination: {limit: defaultPaginatedQueryParam.limit, offset: 0},
  });

  let rawData;
  let data: PaginatedResults<T>;

  try {
    switch (action) {
      case ACCOUNTS:
        rawData = await validator.getAccounts(queryParams);
        data = formatPaginatedData(rawData);
        break;

      case BANKS:
        rawData = await validator.getBanks(queryParams);
        data = formatPaginatedData(rawData);
        break;

      case VALIDATORS:
        rawData = await validator.getValidators(queryParams);
        data = formatPaginatedData(rawData);
        break;

      default:
        throw new Error('Fetch Validator Pagination Action not Set');
    }

    dispatch(setResults({address, ...data}));
    return data.results;
  } catch (error) {
    if (!error.response) {
      throw error;
    }
    dispatch(setError({address, error: error.response.data}));
  }
}

function formatPaginatedData<T>(rawData: PaginatedResults<T>) {
  return {
    ...rawData,
    results: rawData.results.map((result: any) => {
      if (!result.port) {
        return {
          ...result,
          port: replaceNullPortFieldWithDefaultValue(result.port),
        };
      }
      return result;
    }),
  };
}

const replaceNullPortFieldWithDefaultValue = (port: number | null): number => {
  if (port === null) {
    return 80;
  }
  return port;
};

export const sanitizePortFieldFromRawBankConfig = (data: RawBankConfig): BankConfig => {
  return {
    ...data,
    port: replaceNullPortFieldWithDefaultValue(data.port),
    primary_validator: sanitizePortFieldFromRawPrimaryValidatorConfig(data.primary_validator),
  };
};

export const sanitizePortFieldFromRawValidatorConfig = (data: RawValidatorConfig): ValidatorConfig => {
  return {
    ...data,
    port: replaceNullPortFieldWithDefaultValue(data.port),
  };
};

export const sanitizePortFieldFromRawPrimaryValidatorConfig = (
  data: RawPrimaryValidatorInNodeConfig,
): PrimaryValidatorInNodeConfig => {
  return {
    ...data,
    port: replaceNullPortFieldWithDefaultValue(data.port),
  };
};
