import React, {ChangeEvent, Dispatch, FC, useCallback, useEffect, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import clsx from 'clsx';
import noop from 'lodash/noop';
import {Account} from 'thenewboston';
import {Button, Icon, IconType} from '@thenewboston/ui';

import ExpandableText from '@renderer/components/ExpandableText';
import {Input, Loader} from '@renderer/components/FormElements';
import PageTable from '@renderer/components/PageTable';
import {PageTableData, PageTableItems} from '@renderer/components/PaginatedTable';
import RequiredAsterisk from '@renderer/components/RequiredAsterisk';
import {fetchAccountBalance} from '@renderer/dispatchers/balances';
import {
  getAccountBalances,
  getPrimaryValidator,
  getPrimaryValidatorConfig,
  getBankConfigs,
  getActiveBankConfig,
} from '@renderer/selectors';
import {AppDispatch, ManagedNode} from '@renderer/types';
import {formatAddressFromNode, isSameNode} from '@renderer/utils/address';
import {displayErrorToast} from '@renderer/utils/toast';
import {getBankTxFee, getPrimaryValidatorTxFee} from '@renderer/utils/transactions';

import ConnectionStatus from '../../ConnectionStatus';
import {
  checkConnectionBankToValidator,
  checkConnectionValidatorToBank,
  removeValidatorInForm,
  SelectedValidatorState,
  setValidatorInForm,
  ValidatorConnectionStatus,
  ValidatorFormAction,
  ValidatorFormState,
} from '../../utils';
import './BulkPurchaseConfirmationServicesModalFields.scss';

interface ComponentProps {
  dispatchFormValues: Dispatch<ValidatorFormAction>;
  formValues: ValidatorFormState;
  handleSubmit(): Promise<void>;
  initialValidatorsData: SelectedValidatorState;
  orderedNodeIdentifiers: string[];
  selectedBank: ManagedNode;
  submitting: boolean;
}

enum TableKeys {
  amount,
  dailyRate,
  nodeIdentifier,
  removeValidator,
  status,
}

const BulkPurchaseConfirmationServicesModalFields: FC<ComponentProps> = ({
  dispatchFormValues,
  formValues,
  handleSubmit,
  initialValidatorsData,
  orderedNodeIdentifiers,
  selectedBank,
  submitting,
}) => {
  const selectedBankAddress = formatAddressFromNode(selectedBank);
  const dispatch = useDispatch<AppDispatch>();
  const accountBalances = useSelector(getAccountBalances);
  const activeBankConfig = useSelector(getActiveBankConfig)!;
  const bankConfigs = useSelector(getBankConfigs);
  const primaryValidator = useSelector(getPrimaryValidator)!;
  const primaryValidatorConfig = useSelector(getPrimaryValidatorConfig)!;
  const {data: selectedBankConfig} = bankConfigs[selectedBankAddress];
  const {node_identifier: selectedBankNodeIdentifier} = selectedBankConfig;
  const {accountNumberHex: selectedBankAccountNumber} = new Account(selectedBank.account_signing_key);
  const selectedBankBalance = accountBalances[selectedBankAccountNumber];

  const testConnection = useCallback(
    async (validatorNodeIdentifier: string) => {
      const validator = initialValidatorsData[validatorNodeIdentifier];
      const formValue = formValues[validatorNodeIdentifier];
      try {
        await Promise.all([
          checkConnectionBankToValidator(selectedBank, validator),
          checkConnectionValidatorToBank(selectedBank, validator, selectedBankNodeIdentifier),
        ]);
        dispatchFormValues(
          setValidatorInForm({
            amount: formValue.amount,
            nodeIdentifier: validatorNodeIdentifier,
            status: ValidatorConnectionStatus.connected,
          }),
        );
      } catch (error) {
        dispatchFormValues(
          setValidatorInForm({
            amount: '',
            nodeIdentifier: validatorNodeIdentifier,
            status: ValidatorConnectionStatus.notConnected,
          }),
        );
      }
    },
    [selectedBank, selectedBankNodeIdentifier, dispatchFormValues, formValues, initialValidatorsData],
  );

  useEffect(() => {
    for (const nodeIdentifier of orderedNodeIdentifiers) {
      testConnection(nodeIdentifier);
    }
    // ensure that this only runs once
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    try {
      dispatch(fetchAccountBalance(selectedBankAccountNumber));
    } catch (error) {
      displayErrorToast(error);
    }
  }, [selectedBankAccountNumber, dispatch]);

  const handleAmountChange = useCallback(
    (nodeIdentifier: string) => (e: ChangeEvent<HTMLInputElement>): void => {
      e.preventDefault();
      if (submitting) return;
      const formValue = formValues[nodeIdentifier];
      dispatchFormValues(setValidatorInForm({amount: e.target.value, nodeIdentifier, status: formValue.status}));
    },
    [dispatchFormValues, formValues, submitting],
  );

  const handleRemoveValidator = useCallback(
    (nodeIdentifier: string) => (): void => {
      if (submitting) return;
      dispatchFormValues(removeValidatorInForm({nodeIdentifier}));
    },
    [dispatchFormValues, submitting],
  );

  const validatorsTableData = useMemo<PageTableData[]>(
    () =>
      orderedNodeIdentifiers
        .filter((nodeIdentifier) => !!formValues[nodeIdentifier])
        .map((nodeIdentifier) => {
          const formData = formValues[nodeIdentifier];
          const validatorData = initialValidatorsData[nodeIdentifier];

          const noDailyRate = !validatorData.daily_confirmation_rate;
          const validatorIsPv = primaryValidator && isSameNode(primaryValidator, validatorData);
          const amountIsDisabled =
            noDailyRate || validatorIsPv || formData.status !== ValidatorConnectionStatus.connected || submitting;

          return {
            key: nodeIdentifier,
            [TableKeys.amount]: (
              <Input
                className="BulkPurchaseConfirmationServicesModalFields__Input"
                onChange={handleAmountChange(nodeIdentifier)}
                disabled={amountIsDisabled}
                type="number"
                value={formData.amount}
              />
            ),
            [TableKeys.dailyRate]: validatorData.daily_confirmation_rate,
            [TableKeys.nodeIdentifier]: <ExpandableText expanded={false} text={nodeIdentifier} />,
            [TableKeys.removeValidator]: (
              <Icon
                className="BulkPurchaseConfirmationServicesModalFields__close-button"
                icon={IconType.close}
                onClick={handleRemoveValidator(nodeIdentifier)}
              />
            ),
            [TableKeys.status]: <ConnectionStatus status={formData.status} />,
          };
        }),
    [
      formValues,
      handleAmountChange,
      handleRemoveValidator,
      initialValidatorsData,
      orderedNodeIdentifiers,
      primaryValidator,
      submitting,
    ],
  );

  const pageTableItems = useMemo<PageTableItems>(
    () => ({
      data: validatorsTableData,
      headers: {
        [TableKeys.amount]: (
          <span>
            Amount
            <RequiredAsterisk />
          </span>
        ),
        [TableKeys.dailyRate]: 'Daily Rate',
        [TableKeys.nodeIdentifier]: 'Validator Network ID',
        [TableKeys.removeValidator]: '',
        [TableKeys.status]: 'Status',
      },
      orderedKeys: [
        TableKeys.nodeIdentifier,
        TableKeys.status,
        TableKeys.dailyRate,
        TableKeys.amount,
        TableKeys.removeValidator,
      ],
    }),
    [validatorsTableData],
  );

  const bankFee = useMemo(() => getBankTxFee(activeBankConfig, selectedBankConfig.account_number), [
    activeBankConfig,
    selectedBankConfig,
  ]);

  const pvFee = useMemo(() => getPrimaryValidatorTxFee(primaryValidatorConfig, selectedBankAddress), [
    selectedBankAddress,
    primaryValidatorConfig,
  ]);

  const totalAmount = useMemo(
    () =>
      Object.values(formValues).reduce((sum, {amount, status}) => {
        if (amount && status === ValidatorConnectionStatus.connected) {
          return sum + parseInt(amount, 10);
        }
        return sum;
      }, 0),
    [formValues],
  );

  const totalValidators = useMemo(
    () =>
      Object.values(formValues).reduce((count, {amount}) => {
        if (amount) {
          return count + 1;
        }
        return count;
      }, 0),
    [formValues],
  );

  const totalTx = bankFee + pvFee + totalAmount;

  const totalExceedsAvailableBalance = totalTx > (selectedBankBalance?.balance || 0);

  return (
    <div className="BulkPurchaseConfirmationServicesModalFields">
      <div className="BulkPurchaseConfirmationServicesModalFields__left">
        <PageTable className="BulkPurchaseConfirmationServicesModalFields__validator-table" items={pageTableItems} />
      </div>
      <div className="BulkPurchaseConfirmationServicesModalFields__right">
        <div className="BulkPurchaseConfirmationServicesModalFields__bank-address">{selectedBankAddress}</div>
        <div className="BulkPurchaseConfirmationServicesModalFields__bank-nickname">{selectedBank.nickname}</div>
        <table className="BulkPurchaseConfirmationServicesModalFields__summary-table">
          <tbody>
            <tr>
              <td>Account Balance</td>
              <td>{selectedBankBalance?.balance.toLocaleString() || '-'}</td>
            </tr>
            <tr>
              <td>Active Bank Fee</td>
              <td>{bankFee?.toLocaleString() || '-'}</td>
            </tr>
            <tr>
              <td>Primary Validator Fee</td>
              <td>{pvFee.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Total Amount</td>
              <td>{totalAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>TOTAL Tx</td>
              <td>
                <strong className={clsx({'total-tx--error': totalExceedsAvailableBalance})}>
                  {totalTx.toLocaleString()}
                </strong>
              </td>
            </tr>
            <tr>
              <td>TOTAL Validators</td>
              <td>
                <strong>{totalValidators.toLocaleString()}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <Button
          className="BulkPurchaseConfirmationServicesModalFields__purchase-button"
          disabled={!totalAmount || submitting || totalExceedsAvailableBalance}
          onClick={totalAmount ? handleSubmit : noop}
        >
          {submitting ? <Loader /> : 'Purchase'}
        </Button>
      </div>
    </div>
  );
};

export default BulkPurchaseConfirmationServicesModalFields;
