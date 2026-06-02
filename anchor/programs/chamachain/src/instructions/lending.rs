use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::ChamaError;
use crate::state::*;

// ------------------------------------------------------------------
// request_loan
// ------------------------------------------------------------------

#[derive(Accounts)]
pub struct RequestLoan<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,

    pub chama: Box<Account<'info, Chama>>,

    #[account(
        seeds = [MEMBER_SEED, chama.key().as_ref(), borrower.key().as_ref()],
        bump = member.bump,
        has_one = chama,
        constraint = member.owner == borrower.key() @ ChamaError::Unauthorized,
    )]
    pub member: Box<Account<'info, Member>>,

    #[account(
        seeds = [REPUTATION_SEED, borrower.key().as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Box<Account<'info, Reputation>>,

    #[account(
        mut,
        seeds = [TREASURY_SEED, chama.key().as_ref()],
        bump = treasury.bump,
        has_one = chama,
    )]
    pub treasury: Box<Account<'info, Treasury>>,

    #[account(
        init,
        payer = borrower,
        space = 8 + LoanRecord::INIT_SPACE,
        seeds = [LOAN_SEED, chama.key().as_ref(), &treasury.loan_count.to_le_bytes()],
        bump
    )]
    pub loan: Box<Account<'info, LoanRecord>>,

    pub system_program: Program<'info, System>,
}

pub fn request_loan(ctx: Context<RequestLoan>, amount: u64, duration_days: u16) -> Result<()> {
    let chama = &ctx.accounts.chama;
    require!(chama.status == ChamaStatus::Active, ChamaError::ChamaNotActive);
    require!(amount > 0, ChamaError::InvalidLoanAmount);
    require!(
        (1..=MAX_LOAN_DURATION_DAYS).contains(&duration_days),
        ChamaError::InvalidLoanDuration
    );

    let reputation = &ctx.accounts.reputation;
    require!(
        reputation.score >= MIN_LOAN_REPUTATION,
        ChamaError::InsufficientReputation
    );

    let member = &ctx.accounts.member;
    require!(member.active_loan.is_none(), ChamaError::ActiveLoanExists);

    let max_loan = max_loan_for(member.total_contributed, reputation.score);
    require!(amount <= max_loan, ChamaError::ExceedsMaxLoan);

    let treasury = &mut ctx.accounts.treasury;
    require!(
        amount <= treasury.available_liquidity,
        ChamaError::InsufficientLiquidity
    );

    let interest = (amount as u128)
        .checked_mul(LOAN_INTEREST_BPS as u128)
        .and_then(|v| v.checked_div(BPS_DENOMINATOR as u128))
        .ok_or(ChamaError::MathOverflow)? as u64;
    let amount_due = amount.checked_add(interest).ok_or(ChamaError::MathOverflow)?;

    let now = Clock::get()?.unix_timestamp;
    let loan = &mut ctx.accounts.loan;
    loan.chama = chama.key();
    loan.borrower = ctx.accounts.borrower.key();
    loan.loan_id = treasury.loan_count;
    loan.amount = amount;
    loan.interest_bps = LOAN_INTEREST_BPS;
    loan.amount_due = amount_due;
    loan.duration_secs = duration_days as i64 * SECONDS_PER_DAY;
    loan.status = LoanStatus::Pending;
    loan.approved_by = None;
    loan.requested_at = now;
    loan.approved_at = 0;
    loan.due_at = 0;
    loan.bump = ctx.bumps.loan;

    treasury.loan_count = treasury
        .loan_count
        .checked_add(1)
        .ok_or(ChamaError::MathOverflow)?;

    Ok(())
}

// ------------------------------------------------------------------
// approve_loan  (creator-gated in Phase 1)
// ------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(loan_id: u64)]
pub struct ApproveLoan<'info> {
    pub creator: Signer<'info>,

    #[account(has_one = creator @ ChamaError::Unauthorized)]
    pub chama: Box<Account<'info, Chama>>,

    #[account(
        mut,
        seeds = [TREASURY_SEED, chama.key().as_ref()],
        bump = treasury.bump,
        has_one = chama,
    )]
    pub treasury: Box<Account<'info, Treasury>>,

    #[account(
        mut,
        seeds = [LOAN_SEED, chama.key().as_ref(), &loan_id.to_le_bytes()],
        bump = loan.bump,
        has_one = chama,
        constraint = loan.borrower == borrower_member.owner @ ChamaError::Unauthorized,
    )]
    pub loan: Box<Account<'info, LoanRecord>>,

    #[account(
        mut,
        seeds = [MEMBER_SEED, chama.key().as_ref(), borrower_member.owner.as_ref()],
        bump = borrower_member.bump,
        has_one = chama,
    )]
    pub borrower_member: Box<Account<'info, Member>>,

    #[account(
        mut,
        seeds = [TREASURY_VAULT_SEED, chama.key().as_ref()],
        bump
    )]
    pub treasury_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = treasury_vault.mint,
        associated_token::authority = borrower_member.owner,
    )]
    pub borrower_usdt_ata: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn approve_loan(ctx: Context<ApproveLoan>, _loan_id: u64) -> Result<()> {
    let chama_key = ctx.accounts.chama.key();
    require!(
        ctx.accounts.chama.status == ChamaStatus::Active,
        ChamaError::ChamaNotActive
    );

    let loan = &mut ctx.accounts.loan;
    require!(loan.status == LoanStatus::Pending, ChamaError::InvalidLoanStatus);

    require!(
        ctx.accounts.borrower_member.active_loan.is_none(),
        ChamaError::ActiveLoanExists
    );

    let treasury = &mut ctx.accounts.treasury;
    require!(
        loan.amount <= treasury.available_liquidity,
        ChamaError::InsufficientLiquidity
    );

    // Disburse principal from the treasury vault to the borrower.
    let treasury_seeds: &[&[u8]] = &[TREASURY_SEED, chama_key.as_ref(), &[treasury.bump]];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.treasury_vault.to_account_info(),
                to: ctx.accounts.borrower_usdt_ata.to_account_info(),
                authority: treasury.to_account_info(),
            },
            &[treasury_seeds],
        ),
        loan.amount,
    )?;

    treasury.available_liquidity -= loan.amount;
    treasury.total_loaned_out = treasury
        .total_loaned_out
        .checked_add(loan.amount)
        .ok_or(ChamaError::MathOverflow)?;

    let now = Clock::get()?.unix_timestamp;
    loan.status = LoanStatus::Active;
    loan.approved_by = Some(ctx.accounts.creator.key());
    loan.approved_at = now;
    loan.due_at = now + loan.duration_secs;

    ctx.accounts.borrower_member.active_loan = Some(loan.key());

    Ok(())
}

// ------------------------------------------------------------------
// repay_loan
// ------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(loan_id: u64)]
pub struct RepayLoan<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,

    pub chama: Box<Account<'info, Chama>>,

    #[account(
        mut,
        seeds = [TREASURY_SEED, chama.key().as_ref()],
        bump = treasury.bump,
        has_one = chama,
    )]
    pub treasury: Box<Account<'info, Treasury>>,

    #[account(
        mut,
        seeds = [LOAN_SEED, chama.key().as_ref(), &loan_id.to_le_bytes()],
        bump = loan.bump,
        has_one = chama,
        constraint = loan.borrower == borrower.key() @ ChamaError::Unauthorized,
    )]
    pub loan: Box<Account<'info, LoanRecord>>,

    #[account(
        mut,
        seeds = [MEMBER_SEED, chama.key().as_ref(), borrower.key().as_ref()],
        bump = member.bump,
        has_one = chama,
    )]
    pub member: Box<Account<'info, Member>>,

    #[account(
        mut,
        seeds = [REPUTATION_SEED, borrower.key().as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Box<Account<'info, Reputation>>,

    #[account(
        mut,
        seeds = [TREASURY_VAULT_SEED, chama.key().as_ref()],
        bump
    )]
    pub treasury_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = treasury_vault.mint,
        associated_token::authority = borrower,
    )]
    pub borrower_usdt_ata: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn repay_loan(ctx: Context<RepayLoan>, _loan_id: u64) -> Result<()> {
    let loan = &mut ctx.accounts.loan;
    require!(loan.status == LoanStatus::Active, ChamaError::InvalidLoanStatus);

    let amount_due = loan.amount_due;

    // Repay principal + interest into the treasury vault (treasury grows).
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.borrower_usdt_ata.to_account_info(),
                to: ctx.accounts.treasury_vault.to_account_info(),
                authority: ctx.accounts.borrower.to_account_info(),
            },
        ),
        amount_due,
    )?;

    let treasury = &mut ctx.accounts.treasury;
    treasury.available_liquidity = treasury
        .available_liquidity
        .checked_add(amount_due)
        .ok_or(ChamaError::MathOverflow)?;
    treasury.total_repaid = treasury
        .total_repaid
        .checked_add(amount_due)
        .ok_or(ChamaError::MathOverflow)?;

    loan.status = LoanStatus::Repaid;
    ctx.accounts.member.active_loan = None;

    let rep = &mut ctx.accounts.reputation;
    rep.reward(REP_LOAN_REPAID);
    rep.loans_repaid += 1;

    Ok(())
}

// ------------------------------------------------------------------
// mark_loan_default
// ------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(loan_id: u64)]
pub struct MarkLoanDefault<'info> {
    pub caller: Signer<'info>,

    pub chama: Box<Account<'info, Chama>>,

    #[account(
        mut,
        seeds = [LOAN_SEED, chama.key().as_ref(), &loan_id.to_le_bytes()],
        bump = loan.bump,
        has_one = chama,
        constraint = loan.borrower == member.owner @ ChamaError::Unauthorized,
    )]
    pub loan: Box<Account<'info, LoanRecord>>,

    #[account(
        mut,
        seeds = [MEMBER_SEED, chama.key().as_ref(), member.owner.as_ref()],
        bump = member.bump,
        has_one = chama,
    )]
    pub member: Box<Account<'info, Member>>,

    #[account(
        mut,
        seeds = [REPUTATION_SEED, member.owner.as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Box<Account<'info, Reputation>>,
}

pub fn mark_loan_default(ctx: Context<MarkLoanDefault>, _loan_id: u64) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;

    let loan = &mut ctx.accounts.loan;
    require!(loan.status == LoanStatus::Active, ChamaError::InvalidLoanStatus);
    require!(now > loan.due_at, ChamaError::LoanNotDue);

    // The principal stays out of the treasury (liquidity was never restored),
    // reflecting the realized loss. Record the default and penalize hard.
    loan.status = LoanStatus::Defaulted;
    ctx.accounts.member.active_loan = None;

    let rep = &mut ctx.accounts.reputation;
    rep.penalize(REP_LOAN_DEFAULT_PENALTY);
    rep.loans_defaulted += 1;

    Ok(())
}
