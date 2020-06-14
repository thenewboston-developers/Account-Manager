import React from 'react';
import {useSelector} from 'react-redux';
import {NavLink} from 'react-router-dom';

import LeftSubmenu from '@renderer/containers/LeftSubmenu';
import {RootState} from '@renderer/types/store';

import './LeftMenu.scss';

const LeftComponentSelector = ({banks, friends, points, validators, wallets}: RootState) => ({
  banks,
  friends,
  points,
  validators,
  wallets,
});

const LeftMenu = () => {
  const {banks, friends, points, validators, wallets} = useSelector(LeftComponentSelector);

  const renderAccounts = () => {
    return wallets.map(({id, name}) => (
      <NavLink className="MenuItem" key={id} to="/">
        {name} ({id})
      </NavLink>
    ));
  };

  const renderFriends = () => {
    return friends.map(({id, name}) => (
      <NavLink className="MenuItem" key={id} to="/">
        {name}
      </NavLink>
    ));
  };

  const renderManagedBanks = () => {
    return banks.map(({ip_address}) => (
      <NavLink className="MenuItem" key={ip_address} to="/">
        {ip_address}
      </NavLink>
    ));
  };

  const renderManagedValidators = () => {
    return validators.map(({ip_address}) => (
      <NavLink className="MenuItem" key={ip_address} to="/">
        {ip_address}
      </NavLink>
    ));
  };

  return (
    <div className="LeftMenu">
      <div className="LeftMenu__points">
        <div className="submenu-title">Points</div>
        <div className="points__amount">{points.toLocaleString()}</div>
      </div>
      <LeftSubmenu
        menuItems={[
          <NavLink className="MenuItem" to="/bank">
            Bank ({banks.length})
          </NavLink>,
          <NavLink className="MenuItem" to="/validator">
            Validators ({validators.length})
          </NavLink>,
        ]}
        title="Network"
      />
      <LeftSubmenu
        menuItems={renderManagedBanks()}
        title="Managed Banks"
        tool={<span className="material-icons">add</span>}
      />
      <LeftSubmenu
        menuItems={renderManagedValidators()}
        title="Managed Validators"
        tool={<span className="material-icons">add</span>}
      />
      <LeftSubmenu menuItems={renderAccounts()} title="Accounts" tool={<span className="material-icons">add</span>} />
      <LeftSubmenu menuItems={renderFriends()} title="Friends" tool={<span className="material-icons">add</span>} />
    </div>
  );
};

export default LeftMenu;
