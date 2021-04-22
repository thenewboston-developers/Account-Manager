import React, {FC, ReactNode, useCallback, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {ButtonType, ButtonVariant, Icon, IconType} from '@thenewboston/ui';

import {FormButton} from '@renderer/components/FormComponents';
import Modal from '@renderer/components/Modal';
import {INVALID_AMOUNT_ERROR, MATCH_ERROR} from '@renderer/constants/form-validation';
import {fetchAccountBalance} from '@renderer/dispatchers/balances';
import {
  getActiveBankConfig,
  getPrimaryValidatorConfig,
  getManagedAccountBalances,
  getManagedAccounts,
} from '@renderer/selectors';
import {AppDispatch} from '@renderer/types';
import {sendBlock} from '@renderer/utils/blocks';
import yup from '@renderer/utils/forms/yup';
import {displayErrorToast, displayToast} from '@renderer/utils/toast';
import {getBankTxFee, getPrimaryValidatorTxFee} from '@renderer/utils/transactions';

import SendCoinsModalFields, {FormValues} from './SendCoinsModalFields';
import './SendCoinsModal.scss';

const COIN_AMOUNT_CEILING = 100_000_000;

interface ComponentProps {
  close(): void;
  initialRecipient: string;
  initialSender: string;
}

const SendCoinsModal: FC<ComponentProps> = ({close, initialRecipient, initialSender}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const activeBank = useSelector(getActiveBankConfig)!;
  const primaryValidator = useSelector(getPrimaryValidatorConfig)!;
  const managedAccounts = useSelector(getManagedAccounts);
  const managedAccountBalances = useSelector(getManagedAccountBalances);

  const checkCoinsWithBalance = useCallback(
    (coins: number, accountNumber: string): boolean => {
      if (!accountNumber || !coins) return true;
      const {balance} = managedAccountBalances[accountNumber];
      if (!balance) return false;
      const totalCost =
        getBankTxFee(activeBank, accountNumber) + getPrimaryValidatorTxFee(primaryValidator, accountNumber) + coins;
      return totalCost <= balance;
    },
    [activeBank, primaryValidator, managedAccountBalances],
  );

  const initialValues = useMemo(
    () => ({
      coins: '',
      memo: '',
      recipientAccountNumber: initialRecipient,
      senderAccountNumber: initialSender,
    }),
    [initialRecipient, initialSender],
  );

  const handleSubmit = async ({
    coins,
    memo,
    recipientAccountNumber,
    senderAccountNumber,
  }: FormValues): Promise<void> => {
    try {
      setSubmitting(true);
      await sendBlock(activeBank, managedAccounts[senderAccountNumber].signing_key, [
        {amount: parseInt(coins, 10), memo, recipient: recipientAccountNumber},
      ]);
      await Promise.all([
        dispatch(fetchAccountBalance(senderAccountNumber)),
        dispatch(fetchAccountBalance(recipientAccountNumber)),
      ]);
      displayToast('Your payment has been sent', 'success');
      close();
    } catch (error) {
      displayErrorToast(error);
      setSubmitting(false);
    }
  };

  const renderFooter = (): ReactNode => {
    return (
      <>
        <FormButton
          className="Modal__default-cancel SendCoinsModal__default-cancel"
          onClick={close}
          submitting={submitting}
          variant={ButtonVariant.link}
        >
          Cancel
        </FormButton>
        <FormButton
          className="Modal__default-submit SendCoinsModal__default-submit"
          submitting={submitting}
          type={ButtonType.submit}
        >
          Send <Icon className="SendCoinsModal__submit-icon" icon={IconType.tnb} size={16} totalSize={16} />
        </FormButton>
      </>
    );
  };

  const validationSchema = useMemo(() => {
    const senderAccountNumberRef = yup.ref('senderAccountNumber');
    return yup.object().shape({
      coins: yup
        .number()
        .callbackWithRef(senderAccountNumberRef, checkCoinsWithBalance, INVALID_AMOUNT_ERROR)
        .moreThan(0, 'Coins must be greater than 0')
        .lessThan(COIN_AMOUNT_CEILING, `Coins must be less than ${COIN_AMOUNT_CEILING.toLocaleString()}`)
        .integer('Coins cannot be a decimal')
        .required('Coins is a required field'),
      memo: yup
        .string()
        .matches(/^[a-zA-Z0-9_ ]*$/, 'Memo can only contain alphanumeric characters, spaces, and underscores')
        .max(64, 'Memo cannot exceed 64 characters'),
      recipientAccountNumber: yup
        .string()
        .notEqualTo(senderAccountNumberRef, MATCH_ERROR)
        .length(64, 'Account Number must be 64 characters long')
        .required('This field is required'),
      senderAccountNumber: yup.string().required('This field is required'),
    });
  }, [checkCoinsWithBalance]);

  return (
    <Modal
      className="SendCoinsModal"
      close={close}
      footer={renderFooter()}
      header="Send Coins"
      initialValues={initialValues}
      onSubmit={handleSubmit}
      submitting={submitting}
      validationSchema={validationSchema}
    >
      <SendCoinsModalFields submitting={submitting} />
    </Modal>
  );
};

export default SendCoinsModal;
