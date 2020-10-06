import React, {FC, ReactNode, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Route, Switch, useRouteMatch, useHistory} from 'react-router-dom';
import sortBy from 'lodash/sortBy';

import Badge from '@renderer/components/Badge';
import {DropdownMenuOption} from '@renderer/components/DropdownMenuButton';
import Icon, {IconType} from '@renderer/components/Icon';
import {Button} from '@renderer/components/FormElements';
import PageHeader from '@renderer/components/PageHeader';
import PageLayout from '@renderer/components/PageLayout';
import PageTabs from '@renderer/components/PageTabs';
import {useAddress, useBooleanState} from '@renderer/hooks';
import {
  getManagedAccounts,
  getIsActivePrimaryValidator,
  getIsManagedValidator,
  getManagedValidators,
} from '@renderer/selectors';
import {setManagedValidator} from '@renderer/store/app';
import {AppDispatch, RootState} from '@renderer/types';
import {parseAddressData} from '@renderer/utils/address';

import AddValidatorSigningKeysModal from './AddValidatorSigningKeysModal';
import EditValidatorNicknameModal from './EditValidatorNicknameModal';
import RemoveValidatorModal from './RemoveValidatorModal';
import ValidatorAccounts from './ValidatorAccounts';
import ValidatorBanks from './ValidatorBanks';
import ValidatorOverview from './ValidatorOverview';
import ValidatorValidators from './ValidatorValidators';
import './Validator.scss';

const Validator: FC = () => {
  const address = useAddress();
  const dispatch = useDispatch<AppDispatch>();
  const history = useHistory();
  const {path, url} = useRouteMatch();
  const [addSigningKeyModalIsOpen, toggleSigningKeyModal] = useBooleanState(false);
  const [editNicknameModalIsOpen, toggleEditNicknameModal] = useBooleanState(false);
  const [removeValidatorModalIsOpen, toggleRemoveValidatorModal] = useBooleanState(false);
  const isActivePrimaryValidator = useSelector((state: RootState) => getIsActivePrimaryValidator(state, address));
  const isManagedValidator = useSelector((state: RootState) => getIsManagedValidator(state, address));
  const managedValidators = useSelector(getManagedValidators);
  const managedValidator = managedValidators[address];
  const managedAccounts = useSelector(getManagedAccounts);

  const isAuthenticated = useMemo((): boolean => {
    return !!managedValidator?.account_signing_key && !!managedValidator?.nid_signing_key;
  }, [managedValidator]);

  const getDropdownMenuOptions = (): DropdownMenuOption[] => {
    if (!isManagedValidator) return [];

    const menuOptions = [
      {
        label: 'Edit Nickname',
        onClick: toggleEditNicknameModal,
      },
      {
        disabled: isActivePrimaryValidator,
        label: 'Remove Validator',
        onClick: toggleRemoveValidatorModal,
      },
      {
        label: `${isAuthenticated ? 'Edit' : 'Add'} Signing Keys (For DEVOPS)`,
        onClick: toggleSigningKeyModal,
      },
    ];

    return sortBy(menuOptions, ['label']);
  };

  const handleAddManagedValidator = (): void => {
    const {ipAddress, port, protocol} = parseAddressData(address);
    dispatch(
      setManagedValidator({
        account_signing_key: '',
        ip_address: ipAddress,
        nickname: '',
        nid_signing_key: '',
        port,
        protocol,
      }),
    );
  };

  const renderAuthenticatedBadge = (): ReactNode => {
    if (!isAuthenticated) return null;
    return <Badge color="tertiary" text="Authenticated" />;
  };

  const renderAccountLinkBadge = (): ReactNode => {
    if (isAuthenticated) {
      const linkedAccount = Object.values(managedAccounts).find(
        ({signing_key}) => signing_key === managedValidator.account_signing_key,
      );
      if (linkedAccount) {
        return (
          <Icon
            icon={IconType.link}
            onClick={() => {
              history.push(`/account/${linkedAccount.account_number}/overview`);
            }}
          />
        );
      }
    }
    return null;
  };

  const renderRightPageHeaderButtons = (): ReactNode => {
    if (isActivePrimaryValidator || isManagedValidator) return null;
    return <Button onClick={handleAddManagedValidator}>Add to Managed Validators</Button>;
  };

  const renderTabContent = (): ReactNode => {
    const tabContentRoutes = [
      {
        content: <ValidatorAccounts />,
        page: 'accounts',
      },
      {
        content: <ValidatorBanks managedValidator={managedValidator} />,
        page: 'banks',
      },
      {
        content: <ValidatorOverview />,
        page: 'overview',
      },
      {
        content: <ValidatorValidators managedValidator={managedValidator} />,
        page: 'validators',
      },
    ];

    return (
      <Switch>
        {tabContentRoutes.map(({content, page}) => (
          <Route key={page} path={`${path}/${page}`}>
            {content}
          </Route>
        ))}
      </Switch>
    );
  };

  const renderTitle = (): string => {
    if (isManagedValidator) {
      return managedValidator.nickname || managedValidator.ip_address;
    }
    const {ipAddress} = parseAddressData(address);
    return ipAddress;
  };

  const renderTop = (): ReactNode => (
    <>
      <PageHeader
        dropdownMenuOptions={getDropdownMenuOptions()}
        leftContent={[renderAuthenticatedBadge(), renderAccountLinkBadge()]}
        rightContent={renderRightPageHeaderButtons()}
        title={renderTitle()}
      />
      <PageTabs
        baseUrl={url}
        items={[
          {
            name: 'Overview',
            page: 'overview',
          },
          {
            name: 'Accounts',
            page: 'accounts',
          },
          {
            name: 'Banks',
            page: 'banks',
          },
          {
            name: 'Validators',
            page: 'validators',
          },
        ]}
      />
    </>
  );

  return (
    <div className="Validator">
      <PageLayout content={renderTabContent()} top={renderTop()} />
      {addSigningKeyModalIsOpen && <AddValidatorSigningKeysModal close={toggleSigningKeyModal} />}
      {editNicknameModalIsOpen && (
        <EditValidatorNicknameModal close={toggleEditNicknameModal} validator={managedValidator} />
      )}
      {removeValidatorModalIsOpen && (
        <RemoveValidatorModal close={toggleRemoveValidatorModal} validator={managedValidator} />
      )}
    </div>
  );
};

export default Validator;
