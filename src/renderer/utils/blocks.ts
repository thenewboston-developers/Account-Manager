import {Account, AccountPaymentHandler, PrimaryValidator} from 'thenewboston';

import {BankConfig, ValidatorConfig} from '@renderer/types';
import {formatAddress} from '@renderer/utils/address';

export const fetchAccountBalanceLock = async (
  accountNumber: string,
  activePrimaryValidator: ValidatorConfig,
): Promise<string> => {
  const {ip_address: ipAddress, port, protocol} = activePrimaryValidator;
  const address = formatAddress(ipAddress, port, protocol);
  const validator = new PrimaryValidator(address);

  const {balance_lock: balanceLock} = await validator.getAccountBalanceLock(accountNumber);
  if (balanceLock) {
    return balanceLock;
  }
  throw new Error('Error: fetchAccountBalanceLock');
};

export const sanitizeMemo = (memo: string): string => memo.trim();

export const sendBlock = async (
  activeBankConfig: BankConfig,
  senderSigningKey: string,
  transactions: Array<{amount: number; memo?: string; recipient: string}>,
): Promise<void> => {
  const {ip_address: ipAddress, port, protocol} = activeBankConfig;
  const bankUrl = formatAddress(ipAddress, port, protocol);
  const sender = new Account(senderSigningKey);

  const paymentHandler = new AccountPaymentHandler({account: sender, bankUrl});

  // configures the payment handler
  // Sets the PV and gets each node's tx fee
  await paymentHandler.init();

  paymentHandler.sendBulkTransactions(transactions);
};
