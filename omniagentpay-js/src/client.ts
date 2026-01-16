import { Bridge } from './bridge';
import {
    PayParams,
    PaymentResult,
    GetBalanceParams,
    WalletInfo,
    WalletSetInfo,
    TransactionInfo,
    SimulateParams,
    SimulationResult,
    CreateWalletParams,
    CreateWalletSetParams,
    ListWalletsParams,
    GetWalletParams,
    ListTransactionsParams,
    CreatePaymentIntentParams,
    ConfirmPaymentIntentParams,
    GetPaymentIntentParams,
    CancelPaymentIntentParams,
    PaymentIntent,
    AddBudgetGuardParams,
    AddBudgetGuardForSetParams,
    AddSingleTxGuardParams,
    AddRecipientGuardParams,
    AddRateLimitGuardParams,
    AddConfirmGuardParams,
    ListGuardsParams,
    ListGuardsForSetParams,
    SyncTransactionParams,
    LedgerEntry,
    BatchPayParams,
    BatchPaymentResult,
    CanPayParams,
    DetectMethodParams,
    PaymentMethod,
    AddConfirmGuardForSetParams,
    AddRateLimitGuardForSetParams,
    AddRecipientGuardForSetParams,
    AddSingleTxGuardForSetParams
} from './types';

export interface OmniAgentPayConfig {
    /**
     * Optional path to the sidecar binary.
     */
    binaryPath?: string;

    /**
     * API Key for Circle. Can also be set via CIRCLE_API_KEY env var.
     */
    apiKey?: string;

    /**
     * Entity Secret for Circle. Can also be set via ENTITY_SECRET env var.
     */
    entitySecret?: string;
}

export class OmniAgentPay {
    private bridge: Bridge;

    constructor(config: OmniAgentPayConfig = {}) {
        if (config.apiKey) process.env.CIRCLE_API_KEY = config.apiKey;
        if (config.entitySecret) process.env.ENTITY_SECRET = config.entitySecret;
        this.bridge = new Bridge(config.binaryPath);
    }

    // ==================== Payment Methods ====================

    /**
     * Send a payment to any supported destination.
     */
    public async pay(params: PayParams): Promise<PaymentResult> {
        return this.bridge.send<PaymentResult>('pay', params);
    }

    /**
     * Simulate a payment without executing.
     */
    public async simulate(params: SimulateParams): Promise<SimulationResult> {
        return this.bridge.send<SimulationResult>('simulate', params);
    }

    /**
     * Check if a recipient can be paid.
     */
    public async canPay(params: CanPayParams): Promise<boolean> {
        return this.bridge.send<boolean>('can_pay', params);
    }

    /**
     * Detect which payment method would be used for a recipient.
     */
    public async detectMethod(params: DetectMethodParams): Promise<PaymentMethod | null> {
        const result = await this.bridge.send<string | null>('detect_method', params);
        return result as PaymentMethod | null;
    }

    /**
     * Execute multiple payments in batch.
     */
    public async batchPay(params: BatchPayParams): Promise<BatchPaymentResult> {
        return this.bridge.send<BatchPaymentResult>('batch_pay', params);
    }

    // ==================== Wallet Methods ====================

    /**
     * Get USDC balance for a wallet.
     */
    public async getBalance(params: GetBalanceParams): Promise<string> {
        return this.bridge.send<string>('get_balance', params);
    }

    /**
     * Create a new wallet.
     */
    public async createWallet(params: CreateWalletParams = {}): Promise<WalletInfo> {
        return this.bridge.send<WalletInfo>('create_wallet', params);
    }

    /**
     * Create a new wallet set.
     */
    public async createWalletSet(params: CreateWalletSetParams = {}): Promise<WalletSetInfo> {
        return this.bridge.send<WalletSetInfo>('create_wallet_set', params);
    }

    /**
     * List wallets (optional filter by set).
     */
    public async listWallets(params: ListWalletsParams = {}): Promise<WalletInfo[]> {
        return this.bridge.send<WalletInfo[]>('list_wallets', params);
    }

    /**
     * List available wallet sets.
     */
    public async listWalletSets(): Promise<WalletSetInfo[]> {
        return this.bridge.send<WalletSetInfo[]>('list_wallet_sets', {});
    }

    /**
     * Get details of a specific wallet.
     */
    public async getWallet(params: GetWalletParams): Promise<WalletInfo> {
        return this.bridge.send<WalletInfo>('get_wallet', params);
    }

    /**
     * List transactions for a wallet or globally.
     */
    public async listTransactions(params: ListTransactionsParams = {}): Promise<TransactionInfo[]> {
        return this.bridge.send<TransactionInfo[]>('list_transactions', params);
    }

    // ==================== Payment Intents ====================

    /**
     * Create a Payment Intent (Authorize).
     */
    public async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
        return this.bridge.send<PaymentIntent>('create_payment_intent', params);
    }

    /**
     * Confirm and execute a Payment Intent (Capture).
     */
    public async confirmPaymentIntent(params: ConfirmPaymentIntentParams): Promise<PaymentResult> {
        return this.bridge.send<PaymentResult>('confirm_payment_intent', params);
    }

    /**
     * Get Payment Intent by ID.
     */
    public async getPaymentIntent(params: GetPaymentIntentParams): Promise<PaymentIntent | null> {
        return this.bridge.send<PaymentIntent | null>('get_payment_intent', params);
    }

    /**
     * Cancel a Payment Intent.
     */
    public async cancelPaymentIntent(params: CancelPaymentIntentParams): Promise<PaymentIntent> {
        return this.bridge.send<PaymentIntent>('cancel_payment_intent', params);
    }

    // ==================== Guard Methods ====================

    /**
     * Add a budget guard to a wallet.
     */
    public async addBudgetGuard(params: AddBudgetGuardParams): Promise<{ success: boolean }> {
        return this.bridge.send<{ success: boolean }>('add_budget_guard', params);
    }

    /**
     * Add a budget guard to a wallet set.
     */
    public async addBudgetGuardForSet(params: AddBudgetGuardForSetParams): Promise<{ success: boolean }> {
        return this.bridge.send<{ success: boolean }>('add_budget_guard_for_set', params);
    }

    /**
     * Add a Single Transaction Limit guard.
     */
    public async addSingleTxGuard(params: AddSingleTxGuardParams): Promise<{ success: boolean }> {
        return this.bridge.send<{ success: boolean }>('add_single_tx_guard', params);
    }

    /**
     * Add a Recipient Access Control guard.
     */
    public async addRecipientGuard(params: AddRecipientGuardParams): Promise<{ success: boolean }> {
        return this.bridge.send<{ success: boolean }>('add_recipient_guard', params);
    }

    /**
     * Add a rate limit guard to a wallet.
     */
    public async addRateLimitGuard(params: AddRateLimitGuardParams): Promise<{ success: boolean }> {
        return this.bridge.send<{ success: boolean }>('add_rate_limit_guard', params);
    }

    /**
     * Add a confirmation guard to a wallet.
     */
    public async addConfirmGuard(params: AddConfirmGuardParams): Promise<{ success: boolean }> {
        return this.bridge.send<{ success: boolean }>('add_confirm_guard', params);
    }

    /**
     * List all guard names registered for a wallet.
     */
    public async listGuards(params: ListGuardsParams): Promise<string[]> {
        return this.bridge.send<string[]>('list_guards', params);
    }

    /**
     * List all guard names registered for a wallet set.
     */
    public async listGuardsForSet(params: ListGuardsForSetParams): Promise<string[]> {
        return this.bridge.send<string[]>('list_guards_for_set', params);
    }

    /**
     * Add a confirmation guard to a wallet set.
     */
    public async addConfirmGuardForSet(params: AddConfirmGuardForSetParams): Promise<{ success: boolean }> {
        return this.bridge.send<{ success: boolean }>('add_confirm_guard_for_set', params);
    }

    /**
     * Add a rate limit guard to a wallet set.
     */
    public async addRateLimitGuardForSet(params: AddRateLimitGuardForSetParams): Promise<{ success: boolean }> {
        return this.bridge.send<{ success: boolean }>('add_rate_limit_guard_for_set', params);
    }

    /**
     * Add a recipient guard to a wallet set.
     */
    public async addRecipientGuardForSet(params: AddRecipientGuardForSetParams): Promise<{ success: boolean }> {
        return this.bridge.send<{ success: boolean }>('add_recipient_guard_for_set', params);
    }

    /**
     * Add a single transaction guard to a wallet set.
     */
    public async addSingleTxGuardForSet(params: AddSingleTxGuardForSetParams): Promise<{ success: boolean }> {
        return this.bridge.send<{ success: boolean }>('add_single_tx_guard_for_set', params);
    }

    // ==================== Ledger Methods ====================

    /**
     * Synchronize a ledger entry with the provider status.
     */
    public async syncTransaction(params: SyncTransactionParams): Promise<LedgerEntry> {
        return this.bridge.send<LedgerEntry>('sync_transaction', params);
    }

    // ==================== Health ====================

    /**
     * Check if the backend is healthy.
     */
    public async health(): Promise<{ status: string; version: string }> {
        return this.bridge.send<{ status: string; version: string }>('health', {});
    }

    // ==================== Lifecycle ====================

    /**
     * Stop the sidecar process.
     */
    public stop(): void {
        this.bridge.stop();
    }
}
