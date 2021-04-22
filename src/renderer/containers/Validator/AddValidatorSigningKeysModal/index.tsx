import React, {FC, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Account} from 'thenewboston';

import {FormTextArea} from '@renderer/components/FormComponents';
import Modal from '@renderer/components/Modal';
import {SIGNING_KEY_LENGTH_ERROR, SIGNING_KEY_REQUIRED_ERROR} from '@renderer/constants/form-validation';
import {useAddress} from '@renderer/hooks';
import {getManagedAccounts, getManagedValidators, getValidatorConfigs} from '@renderer/selectors';
import {setManagedValidator} from '@renderer/store/app';
import {AppDispatch} from '@renderer/types';
import yup from '@renderer/utils/forms/yup';
import {displayToast} from '@renderer/utils/toast';

interface ComponentProps {
  close(): void;
}

const AddValidatorSigningKeysModal: FC<ComponentProps> = ({close}) => {
  const address = useAddress();
  const dispatch = useDispatch<AppDispatch>();
  const managedAccounts = useSelector(getManagedAccounts);
  const managedValidators = useSelector(getManagedValidators);
  const managedValidator = managedValidators[address];
  const validatorConfigs = useSelector(getValidatorConfigs);
  const {
    data: {account_number: accountNumber, node_identifier: nodeIdentifier},
  } = validatorConfigs[address];

  const initialValues = {
    accountSigningKey:
      Object.values(managedAccounts).find(({account_number}) => account_number === accountNumber)?.signing_key ||
      managedValidator.account_signing_key,
    nidSigningKey: managedValidator.nid_signing_key,
  };

  type FormValues = typeof initialValues;

  const headerTitle = useMemo(() => {
    const prefix = !!managedValidator.account_signing_key && !!managedValidator.nid_signing_key ? 'Edit' : 'Add';
    return `${prefix} Signing Keys`;
  }, [managedValidator]);

  const handleSubmit = ({accountSigningKey, nidSigningKey}: FormValues): void => {
    dispatch(
      setManagedValidator({
        ...managedValidator,
        account_signing_key: accountSigningKey,
        nid_signing_key: nidSigningKey,
      }),
    );
    displayToast('Validator is now authenticated', 'success');
    close();
  };

  const checkPrivateSigningKey = (publicKey: string, privateKey: string): boolean => {
    try {
      const {accountNumberHex} = new Account(privateKey);
      return accountNumberHex === publicKey;
    } catch (error) {
      return false;
    }
  };

  const validationSchema = useMemo(() => {
    return yup.object().shape({
      accountSigningKey: yup
        .string()
        .length(64, SIGNING_KEY_LENGTH_ERROR)
        .required(SIGNING_KEY_REQUIRED_ERROR)
        .test({
          message: 'Resulting public key does not match Account',
          name: 'is-valid-private-key-account',
          test: (key: any) => {
            return checkPrivateSigningKey(accountNumber, key);
          },
        }),
      nidSigningKey: yup
        .string()
        .length(64, SIGNING_KEY_LENGTH_ERROR)
        .required(SIGNING_KEY_REQUIRED_ERROR)
        .test({
          message: 'Resulting public key does not match NID',
          name: 'is-valid-private-key-nid',
          test: (key: any) => {
            return checkPrivateSigningKey(nodeIdentifier, key);
          },
        }),
    });
  }, [accountNumber, nodeIdentifier]);

  return (
    <Modal
      close={close}
      header={headerTitle}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      submitButton="Save"
      validationSchema={validationSchema}
    >
      <FormTextArea focused label="Validator NID Signing Key" name="nidSigningKey" required />
      <FormTextArea label="Validator Account Signing Key" name="accountSigningKey" required />
    </Modal>
  );
};

export default AddValidatorSigningKeysModal;
