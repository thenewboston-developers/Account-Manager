import React, {FC, useEffect, useMemo, useReducer, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import Modal from '@renderer/components/Modal';
import {fetchBankConfig} from '@renderer/dispatchers/banks';
import {getActiveBankConfig} from '@renderer/selectors';
import {AppDispatch, ManagedNode} from '@renderer/types';
import {formatAddressFromNode} from '@renderer/utils/address';
import {sendBlock} from '@renderer/utils/blocks';
import {displayErrorToast, displayToast} from '@renderer/utils/toast';

import BulkPurchaseConfirmationServicesModalFields from './BulkPurchaseConfirmationServicesModalFields';
import {SelectedValidatorState, ValidatorConnectionStatus, validatorFormReducer} from '../utils';
import './BulkPurchaseConfirmationServicesModal.scss';

interface ComponentProps {
  bank: ManagedNode;
  close(): void;
  selectedValidators: SelectedValidatorState;
}

const BulkPurchaseConfirmationServicesModal: FC<ComponentProps> = ({bank, close, selectedValidators}) => {
  const dispatch = useDispatch<AppDispatch>();
  const activeBankConfig = useSelector(getActiveBankConfig)!;

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formValues, dispatchFormValues] = useReducer(
    validatorFormReducer,
    Object.keys(selectedValidators).reduce(
      (acc, nodeIdentifier) => ({
        ...acc,
        [nodeIdentifier]: {amount: '', status: ValidatorConnectionStatus.checking},
      }),
      {},
    ),
  );

  useEffect(() => {
    const bankAddress = formatAddressFromNode(bank);
    dispatch(fetchBankConfig(bankAddress));
  }, [bank, dispatch]);

  const handleSubmit = async (): Promise<void> => {
    try {
      setSubmitting(true);
      const transactions = Object.entries(formValues)
        .map(([nodeIdentifier, {amount}]) => {
          const validatorData = selectedValidators[nodeIdentifier];
          return {
            amount: parseInt(amount, 10),
            recipient: validatorData.account_number,
          };
        })
        .filter(({amount}) => !!amount);

      await sendBlock(activeBankConfig, bank.account_signing_key, transactions);
      displayToast(`You have purchased ${transactions.length} services`, 'success');
      close();
    } catch (error) {
      displayErrorToast(error);
      setSubmitting(false);
    }
  };

  const orderedValidatorNodeIdentifiers = useMemo(() => {
    return Object.entries(selectedValidators)
      .sort(([, {index: indexA}], [, {index: indexB}]) => {
        return indexA - indexB;
      })
      .map(([nodeIdentifier]) => nodeIdentifier);
  }, [selectedValidators]);

  return (
    <Modal
      className="BulkPurchaseConfirmationServicesModal"
      close={close}
      header="Purchase Confirmation Services"
      hideFooter
      submitting={submitting}
    >
      <BulkPurchaseConfirmationServicesModalFields
        selectedBank={bank}
        dispatchFormValues={dispatchFormValues}
        formValues={formValues}
        handleSubmit={handleSubmit}
        initialValidatorsData={selectedValidators}
        orderedNodeIdentifiers={orderedValidatorNodeIdentifiers}
        submitting={submitting}
      />
    </Modal>
  );
};

export default BulkPurchaseConfirmationServicesModal;
