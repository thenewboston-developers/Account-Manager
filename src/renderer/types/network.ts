export enum AcceptedFees {
  bank = 'BANK',
  primaryValidator = 'PRIMARY_VALIDATOR',
}

export interface AccountNumber {
  account_number: string;
}

export interface AddressData {
  ip_address: string;
  port: number;
  protocol: ProtocolType;
}

export interface Balance {
  balance: number;
}

export interface BankAccount extends AccountNumber, CreatedModified, Id {
  account_number: string;
  trust: string;
}

export interface BankConfig extends Omit<Node, 'trust'> {
  node_type: NodeType.bank;
  primary_validator: PrimaryValidatorInNodeConfig;
}

export interface BankConfirmationBlock extends CreatedModified, Id {
  block_identifier: string;
  block: string;
  validator: string;
}

export interface BankTransaction extends Id {
  amount: number;
  block: BlockResponse;
  memo?: string;
  recipient: string;
}

export interface BaseValidator extends Node {
  root_account_file: string;
  root_account_file_hash: string;
  seed_block_identifier: string;
  daily_confirmation_rate: number | null;
}

interface BlockMessage {
  balance_key: string;
  txs: Tx[];
}

interface BlockRequest {
  account_number: string;
  message: BlockMessage;
  signature: string;
}

export interface BlockResponse extends CreatedModified, Id {
  balance_key: string;
  sender: string;
  signature: string;
}

export interface ConfirmationBlockMessage {
  block: BlockRequest;
  block_identifier: string;
  updated_balances: UpdatedBalance[];
}

export interface CreatedModified {
  created_date: string;
  modified_date: string;
}

export interface Error {
  error: string | null;
}

export interface Id {
  id: string;
}

export interface InvalidBlock extends CreatedModified, Id {
  block_identifier: string;
  block: string;
  confirmation_validator: string;
  primary_validator: string;
}

export interface Node extends AccountNumber, AddressData, NodeIdentifier {
  default_transaction_fee: number;
  node_type: NodeType;
  trust: string;
  version: string;
}

export interface NodeIdentifier {
  node_identifier: string;
}

export enum NodeType {
  bank = 'BANK',
  confirmationValidator = 'CONFIRMATION_VALIDATOR',
  primaryValidator = 'PRIMARY_VALIDATOR',
}

export interface PaginatedQueryParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResults<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type PaginatedResultsWithError<T> = PaginatedResults<T> & Error;

export interface PrimaryValidatorConfig extends Omit<BaseValidator, 'trust'> {
  node_type: NodeType.primaryValidator;
}

export type ProtocolType = 'http' | 'https';

export interface RawBankConfig extends Omit<BankConfig, 'port' | 'primary_validator'> {
  port: number | null;
  primary_validator: RawPrimaryValidatorInNodeConfig;
}

export type PrimaryValidatorInNodeConfig = Omit<BaseValidator, 'node_type'>;

export interface RawPrimaryValidatorInNodeConfig extends Omit<PrimaryValidatorInNodeConfig, 'port'> {
  port: number | null;
}

export interface RawPrimaryValidatorConfig extends Omit<PrimaryValidatorConfig, 'port'> {
  port: number | null;
}

export interface RawValidatorConfig extends Omit<ValidatorConfig, 'port'> {
  port: number | null;
}

export interface Tx {
  amount: number;
  fee?: AcceptedFees;
  memo?: string;
  recipient: string;
}

interface UpdatedBalance extends AccountNumber, Balance {
  balance_lock?: string;
}

export interface ValidatorAccount extends AccountNumber, Balance, Id {
  balance_lock: string;
}

export interface ValidatorBank extends Node {
  confirmation_expiration: string | null;
}

export interface ValidatorConfig extends Omit<BaseValidator, 'trust'> {
  node_type: NodeType.primaryValidator | NodeType.confirmationValidator;
}

export interface ValidatorConfirmationBlock {
  message: ConfirmationBlockMessage;
  node_identifier: string;
  signature: string;
}

export interface ValidatorConfirmationService extends Id, CreatedModified {
  end: string;
  start: string;
  validator: string;
}

export interface ValidatorConfirmationServicePayload {
  bank_node_identifier: string;
  validator_confirmation_service: ValidatorConfirmationService;
}
