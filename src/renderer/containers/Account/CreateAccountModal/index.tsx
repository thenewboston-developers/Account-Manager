import React, {FC, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useHistory} from 'react-router-dom';
import {Account} from 'thenewboston';

import Modal from '@renderer/components/Modal';
import {
  ACCOUNT_EXISTS_ERROR,
  SIGNING_KEY_LENGTH,
  SIGNING_KEY_LENGTH_ERROR,
  SIGNING_KEY_REQUIRED_ERROR,
} from '@renderer/constants/form-validation';
import {fetchAccountBalance} from '@renderer/dispatchers/balances';
import {getManagedAccounts, getManagedFriends} from '@renderer/selectors';
import {setManagedAccount} from '@renderer/store/app';
import {setAccountBalance} from '@renderer/store/accountBalances';
import {setManagedAccountBalance} from '@renderer/store/managedAccountBalances';
import {AppDispatch} from '@renderer/types';
import {getNicknameField} from '@renderer/utils/forms/fields';
import yup from '@renderer/utils/forms/yup';
import {displayErrorToast, displayToast} from '@renderer/utils/toast';

import CreateAccountModalFields, {FormValues, initialValues} from './CreateAccountModalFields';
import './CreateAccountModal.scss';

interface ComponentProps {
  close(): void;
  isGetStartedModal?: boolean;
}

const CreateAccountModal: FC<ComponentProps> = ({close, isGetStartedModal = false}) => {
  const [isCreatingNewAccount, setIsCreatingNewAccount] = useState<boolean>(true);
  const dispatch = useDispatch<AppDispatch>();
  const history = useHistory();
  const managedAccounts = useSelector(getManagedAccounts);
  const managedFriends = useSelector(getManagedFriends);

  const managedAccountSigningKeys = useMemo(
    () =>
      Object.values(managedAccounts)
        .filter(({signing_key}) => !!signing_key)
        .map(({signing_key}) => signing_key),
    [managedAccounts],
  );

  const handleSubmit = async ({nickname, signingKey, type}: FormValues): Promise<void> => {
    let [accountNumberStr, balance, signingKeyStr] = ['', 0, ''];

    if (type === 'add') {
      try {
        const {accountNumberHex, signingKeyHex} = new Account(signingKey);
        accountNumberStr = accountNumberHex;
        signingKeyStr = signingKeyHex;

        // check if accountNumber is a friend
        const friendAccount = Object.values(managedFriends).find(
          (managedFriend) => managedFriend.account_number === accountNumberStr,
        );

        if (friendAccount) {
          displayErrorToast(
            `This account with account number:
            ${friendAccount.account_number.slice(0, friendAccount.account_number.length / 2)}
            ${friendAccount.account_number.slice(friendAccount.account_number.length / 2)}
            has already been added as your friend${
              friendAccount.nickname ? `: ${friendAccount.nickname}` : ''
            }. Unable to add friend as your own account.`,
          );
          return;
        }

        balance = await dispatch(fetchAccountBalance(accountNumberStr));
        displayToast('You successfully added an account!', 'success');
      } catch (error) {
        displayErrorToast(error);
        return;
      }
    }

    if (type === 'create') {
      const {accountNumberHex, signingKeyHex} = new Account();
      accountNumberStr = accountNumberHex;
      signingKeyStr = signingKeyHex;
      displayToast('You successfully created an account!', 'success');
    }

    dispatch(
      setManagedAccount({
        account_number: accountNumberStr,
        nickname,
        signing_key: signingKeyStr,
      }),
    );
    const balancePayload = {account_number: accountNumberStr, balance: balance || 0};
    dispatch(setAccountBalance(balancePayload));
    dispatch(setManagedAccountBalance(balancePayload));

    history.push(`/account/${accountNumberStr}/overview`);
    close();
  };

  const validationSchema = useMemo(() => {
    return yup.object().shape({
      nickname: getNicknameField(managedAccounts),
      signingKey: yup.string().when('type', {
        is: 'create',
        otherwise: yup
          .string()
          .length(SIGNING_KEY_LENGTH, SIGNING_KEY_LENGTH_ERROR)
          .notOneOf(managedAccountSigningKeys, ACCOUNT_EXISTS_ERROR)
          .required(SIGNING_KEY_REQUIRED_ERROR),
        then: yup.string(),
      }),
      type: yup.string(),
    });
  }, [managedAccounts, managedAccountSigningKeys]);

  return (
    <Modal
      className="CreateAccountModal"
      close={close}
      disableOverlayClick={isGetStartedModal}
      displayCancelButton={!isGetStartedModal}
      displayCloseButton={!isGetStartedModal}
      header={isGetStartedModal ? 'Get Started' : 'Create/Add Account'}
      ignoreDirty
      initialValues={initialValues}
      onSubmit={handleSubmit}
      submitButton={isCreatingNewAccount ? 'Create' : 'Add'}
      validationSchema={validationSchema}
    >
      <CreateAccountModalFields setIsCreatingNewAccount={setIsCreatingNewAccount} />
    </Modal>
  );
};

export default CreateAccountModal;
