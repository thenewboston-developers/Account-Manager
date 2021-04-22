import React, {FC, useEffect, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Account} from 'thenewboston';

import {FormInput, FormSelectDetailed} from '@renderer/components/FormComponents';
import RequiredAsterisk from '@renderer/components/RequiredAsterisk';
import {fetchBankConfig} from '@renderer/dispatchers/banks';
import {fetchAccountBalance} from '@renderer/dispatchers/balances';
import {useFormContext} from '@renderer/hooks';
import {
  getAccountBalances,
  getActiveBankConfig,
  getPrimaryValidatorConfig,
  getAuthenticatedBanks,
} from '@renderer/selectors';
import {AppDispatch, BaseValidator, InputOption} from '@renderer/types';
import {displayErrorToast} from '@renderer/utils/toast';
import {getBankTxFee, getPrimaryValidatorTxFee} from '@renderer/utils/transactions';

import './PurchaseConfirmationServicesModalFields.scss';

export interface FormValues {
  amount: string;
  bankAddress: string;
}

interface ComponentProps {
  submitting: boolean;
  validator: BaseValidator;
}

const PurchaseConfirmationServicesModalFields: FC<ComponentProps> = ({submitting, validator}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {values} = useFormContext<FormValues>();
  const activeBankConfig = useSelector(getActiveBankConfig)!;
  const primaryValidatorConfig = useSelector(getPrimaryValidatorConfig)!;
  const authenticatedBanks = useSelector(getAuthenticatedBanks);
  const accountBalances = useSelector(getAccountBalances);
  const selectedBank = authenticatedBanks[values.bankAddress];
  const {accountNumberHex: accountNumber} = new Account(selectedBank.account_signing_key);
  const selectedAccountBalance = accountBalances[accountNumber];

  useEffect(() => {
    if (values.bankAddress) {
      dispatch(fetchBankConfig(values.bankAddress));
    }
  }, [dispatch, values.bankAddress]);

  useEffect(() => {
    try {
      dispatch(fetchAccountBalance(accountNumber));
    } catch (error) {
      displayErrorToast(error);
    }
  }, [accountNumber, dispatch]);

  const getFromOptions = useMemo<InputOption[]>(
    () =>
      Object.entries(authenticatedBanks).map(([key, managedBank]) => ({
        label: managedBank.nickname,
        value: key,
      })),
    [authenticatedBanks],
  );

  const renderActiveBankFee = (): string => {
    if (!values?.bankAddress) return activeBankConfig.default_transaction_fee.toLocaleString();
    return getBankTxFee(activeBankConfig, accountNumber).toLocaleString() || '-';
  };

  const renderDays = (): string => {
    const {daily_confirmation_rate: dailyRate} = validator;
    const {amount} = values;
    if (!amount || !dailyRate) return '-';
    const days = (parseInt(amount, 10) / dailyRate).toFixed(2);
    return `${days} days`;
  };

  const renderTotal = (): string => {
    const {amount} = values;
    if (!amount) return '-';
    const bankTxFee = getBankTxFee(activeBankConfig, accountNumber);
    const validatorTxFee = getPrimaryValidatorTxFee(primaryValidatorConfig, accountNumber);
    return (parseInt(amount, 10) + bankTxFee + validatorTxFee).toLocaleString();
  };

  return (
    <>
      <FormSelectDetailed
        disabled={submitting}
        focused
        label="From: Managed Bank"
        name="bankAddress"
        options={getFromOptions}
        required
      />
      <div className="PurchaseConfirmationServicesModalFields__label">To: Validator</div>
      <div className="PurchaseConfirmationServicesModalFields__validator-nid">
        <div>{validator.node_identifier.slice(0, 32)}</div>
        <div>{validator.node_identifier.slice(32)}</div>
      </div>
      <table className="PurchaseConfirmationServicesModalFields__table">
        <tbody>
          <tr>
            <td>Account Balance</td>
            <td>
              <span className="PurchaseConfirmationServicesModalFields__account-balance">
                {selectedAccountBalance?.balance.toLocaleString() || '-'}
              </span>
            </td>
          </tr>
          <tr>
            <td>
              Amount
              <RequiredAsterisk />
            </td>
            <td>
              <FormInput disabled={submitting} hideErrorBlock name="amount" placeholder="0" type="number" />
            </td>
          </tr>
          <tr>
            <td>Daily Rate</td>
            <td>{validator.daily_confirmation_rate}</td>
          </tr>
          <tr>
            <td>Time</td>
            <td>
              <b>{renderDays()}</b>
            </td>
          </tr>
          <tr className="PurchaseConfirmationServicesModalFields__bank-fee-tr">
            <td>Active Bank Fee</td>
            <td>{renderActiveBankFee()}</td>
          </tr>
          <tr>
            <td>Primary Validator Fee</td>
            <td>{getPrimaryValidatorTxFee(primaryValidatorConfig, values?.bankAddress) || '-'}</td>
          </tr>
          <tr>
            <td>Total Tx Cost</td>
            <td>
              <b>{renderTotal()}</b>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default PurchaseConfirmationServicesModalFields;
