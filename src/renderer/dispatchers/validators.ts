import {ConfirmationValidator} from 'thenewboston';

import {defaultPaginatedQueryParam} from '@renderer/config';
import {ACCOUNTS, BANKS, VALIDATORS} from '@renderer/constants/actions';
import {
  setValidatorAccounts,
  setValidatorAccountsError,
  setValidatorBanks,
  setValidatorBanksError,
  setValidatorConfig,
  setValidatorConfigError,
  setValidatorValidators,
  setValidatorValidatorsError,
} from '@renderer/store/validators';
import {
  AppDispatch,
  BaseValidator,
  NodeType,
  PaginatedQueryParams,
  RawValidatorConfig,
  ValidatorAccount,
  ValidatorBank,
  ValidatorConfig,
} from '@renderer/types';
import {fetchValidatorPaginatedResults, sanitizePortFieldFromRawValidatorConfig} from '@renderer/utils/api';

export const fetchValidatorAccounts = (
  address: string,
  params: PaginatedQueryParams = defaultPaginatedQueryParam,
) => async (dispatch: AppDispatch) => {
  return fetchValidatorPaginatedResults<ValidatorAccount>(
    address,
    ACCOUNTS,
    params,
    dispatch,
    setValidatorAccounts,
    setValidatorAccountsError,
  );
};

export const fetchValidatorBanks = (
  address: string,
  params: PaginatedQueryParams = defaultPaginatedQueryParam,
) => async (dispatch: AppDispatch) => {
  return fetchValidatorPaginatedResults<ValidatorBank>(
    address,
    BANKS,
    params,
    dispatch,
    setValidatorBanks,
    setValidatorBanksError,
  );
};

export const fetchValidatorConfig = (address: string) => async (
  dispatch: AppDispatch,
): Promise<{address: string; data?: ValidatorConfig; error?: any}> => {
  try {
    const validator = new ConfirmationValidator(address);

    const rawData = await validator.getConfig();

    const data = sanitizePortFieldFromRawValidatorConfig(rawData as RawValidatorConfig);

    if (data.node_type !== NodeType.primaryValidator && data.node_type !== NodeType.confirmationValidator) {
      const errorObject = {address, error: 'Node not a validator'};
      dispatch(setValidatorConfigError(errorObject));
      return errorObject;
    }

    dispatch(setValidatorConfig({address, data}));
    return {address, data};
  } catch (error) {
    if (error.message) {
      const errorObject = {address, error: error.message};
      dispatch(setValidatorConfigError(errorObject));
      return errorObject;
    }
    if (error.response) {
      const errorObject = {address, error: error.response.data};
      dispatch(setValidatorConfigError(errorObject));
      return errorObject;
    }
    throw error;
  }
};

export const fetchValidatorValidators = (
  address: string,
  params: PaginatedQueryParams = defaultPaginatedQueryParam,
) => async (dispatch: AppDispatch) => {
  return fetchValidatorPaginatedResults<BaseValidator>(
    address,
    VALIDATORS,
    params,
    dispatch,
    setValidatorValidators,
    setValidatorValidatorsError,
  );
};
