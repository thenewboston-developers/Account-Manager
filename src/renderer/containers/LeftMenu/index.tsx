import React, {FC, ReactNode, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import noop from 'lodash/noop';

import Icon, {IconType} from '@renderer/components/Icon';
import CreateAccountModal from '@renderer/containers/Account/CreateAccountModal';
import AddFriendModal from '@renderer/containers/Friend/AddFriendModal';
import LeftSubmenuItem from '@renderer/containers/LeftMenu/LeftSubmenuItem';
import LeftSubmenuItemStatus from '@renderer/containers/LeftMenu/LeftSubmenuItemStatus';
import {useBooleanState} from '@renderer/hooks';
import {
  getActiveBank,
  getActiveBankConfig,
  getActivePrimaryValidatorConfig,
  getManagedAccounts,
} from '@renderer/selectors';
import {unsetActiveBank, unsetActivePrimaryValidator} from '@renderer/store/app';
import {getAccount} from '@renderer/store/old/accounts';
import {AppDispatch, ManagedAccount, RootState} from '@renderer/types';
import {formatPathFromNode} from '@renderer/utils/address';

import LeftSubmenu from './LeftSubmenu';

import './LeftMenu.scss';

const LeftMenuSelector = (state: RootState) => {
  return {
    activeBank: getActiveBankConfig(state),
    activeBankNickname: getActiveBank(state)?.nickname,
    activePrimaryValidator: getActivePrimaryValidatorConfig(state),
    banks: state.old.banks,
    friends: state.old.friends,
    managedAccounts: getManagedAccounts(state),
    points: state.old.points,
    validators: state.old.validators,
  };
};

const LeftMenu: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    activeBank,
    activeBankNickname,
    activePrimaryValidator,
    banks,
    friends,
    managedAccounts,
    points,
    validators,
  } = useSelector(LeftMenuSelector);
  const [addFriendModalIsOpen, toggleAddFriendModal] = useBooleanState(false);
  const [createAccountModalIsOpen, toggleCreateAccountModal] = useBooleanState(false);

  useEffect(() => {
    dispatch(getAccount());
  }, [dispatch]);

  const getAccountItems = (): ReactNode[] => {
    return Object.values(managedAccounts)
      .map(({account_number, nickname}: ManagedAccount) => ({
        baseUrl: `/account/${account_number}`,
        key: account_number,
        label: nickname || account_number,
        to: `/account/${account_number}/overview`,
      }))
      .map(({baseUrl, key, label, to}) => <LeftSubmenuItem baseUrl={baseUrl} key={key} label={label} to={to} />);
  };

  const getActiveBankMenuItem = (): ReactNode => {
    if (!activeBank) return null;
    const baseUrl = `/banks/${formatPathFromNode(activeBank)}`;

    return (
      <LeftSubmenuItemStatus
        baseUrl={baseUrl}
        key="active-bank"
        label={activeBankNickname ? `${activeBankNickname} (${activeBank.ip_address})` : activeBank.ip_address}
        status="online"
        to={`${baseUrl}/overview`}
      />
    );
  };

  const getBankMenuItems = (): ReactNode[] => {
    return banks
      .map(({ip_address: ipAddress, node_identifier: nodeIdentifier}) => ({
        baseUrl: `/bank/${nodeIdentifier}`,
        key: nodeIdentifier,
        label: ipAddress,
        to: `/bank/${nodeIdentifier}/overview`,
      }))
      .map(({baseUrl, key, label, to}) => (
        <LeftSubmenuItemStatus baseUrl={baseUrl} key={key} label={label} status="offline" to={to} />
      ));
  };

  const getFriendMenuItems = (): ReactNode[] => {
    return friends
      .map(({accountNumber, nickname}) => ({
        baseUrl: `/account/${accountNumber}`,
        key: accountNumber,
        label: nickname || accountNumber,
        to: `/account/${accountNumber}/overview`,
      }))
      .map(({baseUrl, key, label, to}) => <LeftSubmenuItem baseUrl={baseUrl} key={key} label={label} to={to} />);
  };

  const getNetworkMenuItems = (): ReactNode[] => {
    if (!activePrimaryValidator) return [];
    return [
      {
        baseUrl: `/validator/${activePrimaryValidator.node_identifier}/banks`,
        key: 'Banks',
        label: 'Banks',
        to: `/validator/${activePrimaryValidator.node_identifier}/banks`,
      },
      {
        baseUrl: `/validator/${activePrimaryValidator.node_identifier}/validators`,
        key: 'Validators',
        label: 'Validators',
        to: `/validator/${activePrimaryValidator.node_identifier}/validators`,
      },
    ].map(({baseUrl, key, label, to}) => <LeftSubmenuItem baseUrl={baseUrl} key={key} label={label} to={to} />);
  };

  const getValidatorMenuItems = (): ReactNode[] => {
    return validators
      .map(({ip_address: ipAddress, network_identifier: networkIdentifier}) => ({
        baseUrl: `/validator/${networkIdentifier}`,
        key: ipAddress,
        label: ipAddress,
        to: `/validator/${networkIdentifier}/overview`,
      }))
      .map(({baseUrl, key, label, to}) => (
        <LeftSubmenuItemStatus baseUrl={baseUrl} key={key} label={label} status="online" to={to} />
      ));
  };

  const handleChangeBank = () => {
    dispatch(unsetActivePrimaryValidator());
    dispatch(unsetActiveBank());
  };

  return (
    <div className="LeftMenu">
      <div className="points">
        <div className="points__title">Points</div>
        <div className="points__amount">{points.toLocaleString()}</div>
      </div>
      <LeftSubmenu
        leftIcon={<Icon className="LeftMenu__icon" icon={IconType.earth} />}
        menuItems={getNetworkMenuItems()}
        title="Network"
      />
      <LeftSubmenu
        menuItems={[getActiveBankMenuItem()]}
        noExpandToggle
        rightOnClick={handleChangeBank}
        rightText="Change"
        title="Active Bank"
      />
      <LeftSubmenu menuItems={getAccountItems()} rightOnClick={toggleCreateAccountModal} title="Accounts" />
      <LeftSubmenu menuItems={getFriendMenuItems()} rightOnClick={toggleAddFriendModal} title="Friends" />
      <LeftSubmenu menuItems={getBankMenuItems()} rightOnClick={noop} title="Managed Banks" />
      <LeftSubmenu menuItems={getValidatorMenuItems()} rightOnClick={noop} title="Managed Validators" />
      {addFriendModalIsOpen && <AddFriendModal close={toggleAddFriendModal} />}
      {createAccountModalIsOpen && <CreateAccountModal close={toggleCreateAccountModal} />}
    </div>
  );
};

export default LeftMenu;
