import {BankConfig, NodeType, ValidatorConfig} from '@renderer/types';
import {getBankTxFee, getPrimaryValidatorTxFee} from './transactions';

describe('getBankTxFee to return the following:', () => {
  let activeBankConfig: BankConfig;
  let senderAccountNumber: string;

  test('correct bank transaction free when active bank account number is not equal to sender account number', () => {
    activeBankConfig = {
      account_number: 'ec15cbf36133b70b3ec8',
      default_transaction_fee: 1,
      ip_address: '123.103.145.54',
      node_identifier: '0cb375955c82b',
      node_type: NodeType.bank,
      port: 80,
      primary_validator: {
        account_number: '2e86f485673025f47644c',
        daily_confirmation_rate: null,
        default_transaction_fee: 1,
        ip_address: '143.110.133.165',
        node_identifier: 'e92e8fbc4d28e519bc',
        port: 80,
        protocol: 'http',
        root_account_file: 'https://account_file.json',
        root_account_file_hash: '5eacfee38ahash7',
        seed_block_identifier: '',
        trust: '100.00',
        version: 'v1.0',
      },
      protocol: 'http',
      version: 'v1.0',
    };
    senderAccountNumber = '056b85b6427d004cfd36a4';
    expect(getBankTxFee(activeBankConfig, senderAccountNumber)).toBe(1);
  });

  test('0 when active bank account number is equal to sender account number', () => {
    activeBankConfig = {
      account_number: '056b85b6427d004cfd36a4',
      default_transaction_fee: 1,
      ip_address: '123.103.145.54',
      node_identifier: '0cb375955c82b',
      node_type: NodeType.bank,
      port: 80,
      primary_validator: {
        account_number: '2e86f485673025f47644c',
        daily_confirmation_rate: null,
        default_transaction_fee: 1,
        ip_address: '143.110.133.165',
        node_identifier: 'e92e8fbc4d28e519bc',
        port: 80,
        protocol: 'http',
        root_account_file: 'https://account_file.json',
        root_account_file_hash: '5eacfee38ahash7',
        seed_block_identifier: '',
        trust: '100.00',
        version: 'v1.0',
      },
      protocol: 'http',
      version: 'v1.0',
    };
    senderAccountNumber = '056b85b6427d004cfd36a4';
    expect(getBankTxFee(activeBankConfig, senderAccountNumber)).toBe(0);
  });
});

describe('getPrimaryValidatorTxFee to return the following:', () => {
  let activePrimaryValidatorConfig: ValidatorConfig;
  let senderAccountNumber: string;

  test('correct primary validator transaction free when active bank account number is not equal to sender account number', () => {
    activePrimaryValidatorConfig = {
      account_number: 'ec15cbf36133b70b3ec8',
      daily_confirmation_rate: null,
      default_transaction_fee: 1,
      ip_address: '123.103.145.54',
      node_identifier: 'e92e8fbc4d28e519bc',
      node_type: NodeType.primaryValidator,
      port: 80,
      protocol: 'http',
      root_account_file: 'https://account_file.json',
      root_account_file_hash: '5eacfee38ahash7',
      seed_block_identifier: '',
      version: 'v1.0',
    };
    senderAccountNumber = '056b85b6427d004cfd36a4';
    expect(getPrimaryValidatorTxFee(activePrimaryValidatorConfig, senderAccountNumber)).toBe(1);
  });

  test('0 when active bank account number is equal to sender account number', () => {
    activePrimaryValidatorConfig = {
      account_number: '056b85b6427d004cfd36a4',
      daily_confirmation_rate: null,
      default_transaction_fee: 1,
      ip_address: '123.103.145.54',
      node_identifier: 'e92e8fbc4d28e519bc',
      node_type: NodeType.primaryValidator,
      port: 80,
      protocol: 'http',
      root_account_file: 'https://account_file.json',
      root_account_file_hash: '5eacfee38ahash7',
      seed_block_identifier: '',
      version: 'v1.0',
    };
    senderAccountNumber = '056b85b6427d004cfd36a4';
    expect(getPrimaryValidatorTxFee(activePrimaryValidatorConfig, senderAccountNumber)).toBe(0);
  });
});
