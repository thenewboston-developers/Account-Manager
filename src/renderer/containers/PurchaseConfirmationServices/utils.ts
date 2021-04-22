import omit from 'lodash/omit';
import {Account, Bank, ConfirmationValidator} from 'thenewboston';

import {BaseValidator, ManagedNode} from '@renderer/types';
import {formatAddressFromNode} from '@renderer/utils/address';

export type SelectedValidatorState = {
  [nodeIdentifier: string]: BaseValidator & {
    index: number;
  };
};

export type ValidatorFormState = {
  [nodeIdentifier: string]: {
    amount: string;
    status: ValidatorConnectionStatus;
  };
};

enum SelectedValidatorTypes {
  clearAll = 'clearAll',
  toggle = 'toggle',
}

enum ValidatorFormTypes {
  set = 'set',
  remove = 'remove',
}

type SelectedValidatorPayload = BaseValidator & {
  index: number;
};

interface ValidatorFormSetPayload {
  amount: string;
  nodeIdentifier: string;
  status: ValidatorConnectionStatus;
}

interface ValidatorFormRemovePayload {
  nodeIdentifier: string;
}

export interface SelectedValidatorAction {
  type: SelectedValidatorTypes;
  payload?: SelectedValidatorPayload;
}

export interface ValidatorFormAction {
  type: ValidatorFormTypes;
  payload: {
    amount?: string;
    nodeIdentifier: string;
    status?: ValidatorConnectionStatus;
  };
}

export const checkConnectionBankToValidator = async (
  managedBank: ManagedNode,
  validator: BaseValidator,
): Promise<void> => {
  const bankAddress = formatAddressFromNode(managedBank);
  const bank = new Bank(bankAddress);

  try {
    await bank.getValidator(validator.node_identifier);
  } catch (error) {
    if (!managedBank.nid_signing_key) throw new Error('No NID SK');
    const bankNetworkKeyPair = new Account(managedBank.nid_signing_key);
    const {ip_address: ipAddress, port, protocol} = validator;
    await bank.sendConnectionRequest(ipAddress, port, protocol, bankNetworkKeyPair);
  }
};

export const checkConnectionValidatorToBank = async (
  managedValidator: ManagedNode,
  validator: BaseValidator,
  bankNodeIdentifier: string,
): Promise<void> => {
  const validatorAddress = formatAddressFromNode(validator);
  const validatorNode = new ConfirmationValidator(validatorAddress);

  try {
    await validatorNode.getBank(bankNodeIdentifier);
  } catch (error) {
    if (!managedValidator.nid_signing_key) throw new Error('No NID SK');
    const validatorNetworkKeyPair = new Account(managedValidator.nid_signing_key);

    const {ip_address: ipAddress, port, protocol} = managedValidator;
    await validatorNode.sendConnectionRequest(ipAddress, port, protocol, validatorNetworkKeyPair);
  }
};

export const clearSelectedValidator = (): SelectedValidatorAction => {
  return {
    type: SelectedValidatorTypes.clearAll,
  };
};

export const toggleSelectedValidator = (payload: SelectedValidatorPayload): SelectedValidatorAction => {
  return {
    payload,
    type: SelectedValidatorTypes.toggle,
  };
};

export const setValidatorInForm = (payload: ValidatorFormSetPayload): ValidatorFormAction => {
  return {
    payload,
    type: ValidatorFormTypes.set,
  };
};

export const removeValidatorInForm = (payload: ValidatorFormRemovePayload): ValidatorFormAction => {
  return {
    payload,
    type: ValidatorFormTypes.remove,
  };
};

export const selectedValidatorReducer = (
  state: SelectedValidatorState,
  {payload, type}: SelectedValidatorAction,
): SelectedValidatorState => {
  switch (type) {
    case SelectedValidatorTypes.toggle: {
      const {node_identifier: nodeIdentifier} = payload!;
      if (nodeIdentifier in state) {
        return omit(state, nodeIdentifier);
      }
      return {
        ...state,
        [nodeIdentifier]: {
          ...payload!,
        },
      };
    }
    case SelectedValidatorTypes.clearAll: {
      return {};
    }
    default:
      throw new Error('Invalid SelectedValidatorActionType');
  }
};

export const validatorFormReducer = (
  state: ValidatorFormState,
  {payload, type}: ValidatorFormAction,
): ValidatorFormState => {
  switch (type) {
    case ValidatorFormTypes.set: {
      return Object.entries(state).reduce((acc, [nodeIdentifier, oldState]): ValidatorFormState => {
        if (nodeIdentifier === payload.nodeIdentifier) {
          return {
            ...acc,
            [nodeIdentifier]: {
              amount: payload.amount,
              status: payload.status,
            },
          };
        }
        return {
          ...acc,
          [nodeIdentifier]: oldState,
        };
      }, {});
    }
    case ValidatorFormTypes.remove: {
      return omit(state, payload.nodeIdentifier);
    }
    default:
      throw new Error('Invalid SelectedValidatorActionType');
  }
};

export enum ValidatorConnectionStatus {
  checking = 'checking',
  connected = 'connected',
  notConnected = 'not-connected',
}
