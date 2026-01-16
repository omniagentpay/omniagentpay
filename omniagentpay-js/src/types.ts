// ==================== Enums ====================
export enum TransactionState {
    PENDING = "PENDING",
    INITIATED = "INITIATED",
    CONFIRMED = "CONFIRMED",
    FAILED = "FAILED",
    COMPLETED = "COMPLETED",
    CANCELED = "CANCELED",
    CANCELLED = "CANCELLED",
    CLEARED = "CLEARED"
}

export enum PaymentMethod {
    TRANSFER = "TRANSFER",
    CROSSCHAIN = "CROSSCHAIN",
    X402 = "X402"
}

export enum PaymentStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    BLOCKED = "BLOCKED",
    REFUNDED = "REFUNDED"
}

export enum AccountType {
    EOA = "EOA",
    SCA = "SCA"
}

export enum CustodyType {
    DEVELOPER = "DEVELOPER",
    USER = "USER"
}

export enum WalletState {
    LIVE = "LIVE",
    FROZEN = "FROZEN",
    ARCHIVED = "ARCHIVED"
}

export enum FeeLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}

export enum Network {
    ETH_MAINNET = "ETH-MAINNET",
    ETH_SEPOLIA = "ETH-SEPOLIA",
    SOL_MAINNET = "SOL",
    SOL_DEVNET = "SOL-DEVNET",
    ARB_MAINNET = "ARB",
    ARB_SEPOLIA = "ARB-SEPOLIA",
    BASE_MAINNET = "BASE",
    BASE_SEPOLIA = "BASE-SEPOLIA",
    ARC_TESTNET = "ARC-TESTNET"
}

export enum PaymentIntentStatus {
    REQUIRES_CONFIRMATION = "requires_confirmation",
    PROCESSING = "processing",
    SUCCEEDED = "succeeded",
    FAILED = "failed",
    CANCELED = "canceled"
}

// ==================== Core Types ====================
export interface PaymentResult {
    success: boolean;
    transaction_id: string | null;
    blockchain_tx: string | null;
    amount: string | null;
    recipient: string;
    method: PaymentMethod | null;
    status: PaymentStatus | null;
    error: string | null;
    guards_passed?: string[];
    metadata?: Record<string, any>;
}

export interface WalletInfo {
    id: string;
    address: string;
    blockchain: string;
    state: WalletState | string;
    wallet_set_id: string;
    custody_type: CustodyType | string;
    account_type: AccountType | string;
    update_date: string | null;
    create_date: string | null;
}

export interface WalletSetInfo {
    id: string;
    name: string | null;
    custody_type: CustodyType | string;
    update_date: string | null;
    create_date: string | null;
}

export interface TransactionInfo {
    id: string;
    state: TransactionState | string;
    tx_hash: string | null;
    amounts: string[];
    source_address: string | null;
    destination_address: string | null;
    blockchain: string;
    fee_level: FeeLevel | null;
    create_date: string | null;
    update_date: string | null;
}

export interface SimulationResult {
    would_succeed: boolean;
    route: PaymentMethod | null;
    reason: string | null;
    estimated_fee: string | null;
}

export interface PaymentIntent {
    id: string;
    wallet_id: string;
    recipient: string;
    amount: string;
    status: PaymentIntentStatus | string;
    metadata: Record<string, any>;
    created_at: string | null;
    updated_at: string | null;
}

export interface LedgerEntry {
    id: string;
    wallet_id: string;
    recipient: string;
    amount: string;
    status: string;
    tx_hash: string | null;
    purpose: string | null;
    metadata: Record<string, any>;
    created_at: string | null;
    updated_at: string | null;
}

export interface BatchPaymentResult {
    total: number;
    succeeded: number;
    failed: number;
    results: PaymentResult[];
}

// ==================== Request Parameter Types ====================
export interface PayParams {
    wallet_id: string;
    recipient: string;
    amount: number | string;
    destination_chain?: string;
    wallet_set_id?: string;
    purpose?: string;
    idempotency_key?: string;
    fee_level?: FeeLevel;
    skip_guards?: boolean;
    metadata?: Record<string, any>;
    wait_for_completion?: boolean;
    timeout_seconds?: number;
}

export interface SimulateParams {
    wallet_id: string;
    recipient: string;
    amount: number | string;
    wallet_set_id?: string;
}

export interface GetBalanceParams {
    wallet_id: string;
}

export interface CreateWalletParams {
    blockchain?: string;
    wallet_set_id?: string;
    account_type?: AccountType;
    name?: string;
}

export interface CreateWalletSetParams {
    name?: string;
}

export interface ListWalletsParams {
    wallet_set_id?: string;
}

export interface GetWalletParams {
    wallet_id: string;
}

export interface ListTransactionsParams {
    wallet_id?: string;
    blockchain?: string;
}

export interface CreatePaymentIntentParams {
    wallet_id: string;
    recipient: string;
    amount: number | string;
    purpose?: string;
    idempotency_key?: string;
}

export interface ConfirmPaymentIntentParams {
    intent_id: string;
}

export interface GetPaymentIntentParams {
    intent_id: string;
}

export interface CancelPaymentIntentParams {
    intent_id: string;
}

export interface AddBudgetGuardParams {
    wallet_id: string;
    daily_limit?: number | string;
    hourly_limit?: number | string;
    total_limit?: number | string;
    name?: string;
}

export interface AddBudgetGuardForSetParams {
    wallet_set_id: string;
    daily_limit?: number | string;
    hourly_limit?: number | string;
    total_limit?: number | string;
    name?: string;
}

export interface AddSingleTxGuardParams {
    wallet_id: string;
    max_amount: number | string;
    min_amount?: number | string;
    name?: string;
}

export interface AddRecipientGuardParams {
    wallet_id: string;
    mode?: 'whitelist' | 'blacklist';
    addresses?: string[];
    patterns?: string[];
    domains?: string[];
    name?: string;
}

export interface AddRateLimitGuardParams {
    wallet_id: string;
    max_per_minute?: number;
    max_per_hour?: number;
    max_per_day?: number;
    name?: string;
}

export interface AddConfirmGuardParams {
    wallet_id: string;
    threshold?: number | string;
    always_confirm?: boolean;
    name?: string;
}

export interface ListGuardsParams {
    wallet_id: string;
}

export interface ListGuardsForSetParams {
    wallet_set_id: string;
}

export interface SyncTransactionParams {
    entry_id: string;
}

export interface BatchPayParams {
    requests: PayParams[];
    concurrency?: number;
}

export interface CanPayParams {
    recipient: string;
}

export interface DetectMethodParams {
    recipient: string;
}

export interface AddConfirmGuardForSetParams {
    wallet_set_id: string;
    threshold?: number | string;
    always_confirm?: boolean;
    name?: string;
}

export interface AddRateLimitGuardForSetParams {
    wallet_set_id: string;
    max_per_minute?: number;
    max_per_hour?: number;
    max_per_day?: number;
    name?: string;
}

export interface AddRecipientGuardForSetParams {
    wallet_set_id: string;
    mode?: 'whitelist' | 'blacklist';
    addresses?: string[];
    patterns?: string[];
    domains?: string[];
    name?: string;
}

export interface AddSingleTxGuardForSetParams {
    wallet_set_id: string;
    max_amount: number | string;
    min_amount?: number | string;
    name?: string;
}
