use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("8gkPp9gCALdkTvzPVk6LjVw4TRg6iKkzaRLU465y9Gye");

/// ChamaChain v2 — decentralized cooperative finance on Solana.
///
/// A rotating savings circle (chama) that grows into a community treasury:
/// members contribute USDT, receive CHM share tokens, pool surplus into a
/// shared treasury, and borrow against their reputation. The treasurer is
/// replaced entirely by this program.
#[program]
pub mod chamachain {
    use super::*;

    // ---------- Protocol / reputation ----------

    /// One-time setup: create global Config + the CHM mint (program-owned authority).
    pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
        instructions::initialize_protocol(ctx)
    }

    /// Create the caller's global reputation record (score 50).
    pub fn initialize_reputation(ctx: Context<InitializeReputation>) -> Result<()> {
        instructions::initialize_reputation(ctx)
    }

    // ---------- Savings circle ----------

    pub fn create_chama(
        ctx: Context<CreateChama>,
        id: u64,
        name: String,
        contribution_amount: u64,
        cycle_duration_secs: i64,
        max_members: u8,
    ) -> Result<()> {
        instructions::create_chama(
            ctx,
            id,
            name,
            contribution_amount,
            cycle_duration_secs,
            max_members,
        )
    }

    pub fn join_chama(ctx: Context<JoinChama>) -> Result<()> {
        instructions::join_chama(ctx)
    }

    pub fn contribute(ctx: Context<Contribute>) -> Result<()> {
        instructions::contribute(ctx)
    }

    pub fn payout(ctx: Context<Payout>) -> Result<()> {
        instructions::payout(ctx)
    }

    pub fn mark_default(ctx: Context<MarkDefault>) -> Result<()> {
        instructions::mark_default(ctx)
    }

    // ---------- Treasury ----------

    pub fn deposit_to_treasury(ctx: Context<DepositToTreasury>, amount: u64) -> Result<()> {
        instructions::deposit_to_treasury(ctx, amount)
    }

    // ---------- Lending ----------

    pub fn request_loan(ctx: Context<RequestLoan>, amount: u64, duration_days: u16) -> Result<()> {
        instructions::request_loan(ctx, amount, duration_days)
    }

    /// Phase 1: approval is gated to the chama creator. When Phase 2 governance
    /// ships, `execute_proposal` becomes an alternate authorized caller here.
    pub fn approve_loan(ctx: Context<ApproveLoan>, loan_id: u64) -> Result<()> {
        instructions::approve_loan(ctx, loan_id)
    }

    pub fn repay_loan(ctx: Context<RepayLoan>, loan_id: u64) -> Result<()> {
        instructions::repay_loan(ctx, loan_id)
    }

    pub fn mark_loan_default(ctx: Context<MarkLoanDefault>, loan_id: u64) -> Result<()> {
        instructions::mark_loan_default(ctx, loan_id)
    }
}
