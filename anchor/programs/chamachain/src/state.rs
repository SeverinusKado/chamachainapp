use anchor_lang::prelude::*;

/// Global protocol configuration. One per deployment.
#[account]
#[derive(InitSpace)]
pub struct Config {
    /// Authority that initialized the protocol.
    pub authority: Pubkey,
    /// Mock USDT mint used for all contributions and loans.
    pub usdt_mint: Pubkey,
    /// CHM share-token mint (mint authority is the program PDA).
    pub chm_mint: Pubkey,
    pub bump: u8,
    /// Bump for the CHM mint-authority PDA.
    pub mint_authority_bump: u8,
}

/// Per-wallet reputation, shared across every chama the wallet belongs to.
/// This is the "connective tissue" updated by savings, treasury and lending.
#[account]
#[derive(InitSpace)]
pub struct Reputation {
    pub owner: Pubkey,
    /// 0..=100 score. Starts at 50.
    pub score: u16,
    pub on_time_contributions: u32,
    pub contribution_defaults: u32,
    pub loans_repaid: u32,
    pub loans_defaulted: u32,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace, Debug)]
pub enum ChamaStatus {
    Active,
    Completed,
}

/// A rotating savings circle.
#[account]
#[derive(InitSpace)]
pub struct Chama {
    pub creator: Pubkey,
    /// Creator-scoped id, lets one wallet run multiple chamas.
    pub id: u64,
    #[max_len(64)]
    pub name: String,
    /// Fixed contribution per member per cycle (USDT, 6 decimals).
    pub contribution_amount: u64,
    pub cycle_duration_secs: i64,
    pub max_members: u8,
    pub member_count: u8,
    /// 1-indexed cycle currently being collected.
    pub current_cycle: u16,
    /// join_index of the next member due to receive a payout.
    pub payout_index: u8,
    /// How many members have been accounted for (paid or defaulted) this cycle.
    pub contributions_this_cycle: u8,
    pub status: ChamaStatus,
    pub created_at: i64,
    pub cycle_deadline: i64,
    pub bump: u8,
}

/// Membership record, one per (chama, wallet).
#[account]
#[derive(InitSpace)]
pub struct Member {
    pub chama: Pubkey,
    pub owner: Pubkey,
    /// Position in the payout rotation.
    pub join_index: u8,
    pub has_received_payout: bool,
    pub contributions_made: u16,
    pub contribution_defaults: u16,
    pub total_contributed: u64,
    pub total_chm_minted: u64,
    /// Last cycle this member contributed to or was defaulted on.
    pub last_processed_cycle: u16,
    /// Set to the loan PDA while a loan is outstanding.
    pub active_loan: Option<Pubkey>,
    pub bump: u8,
}

/// Per-chama shared treasury that funds loans and grows on repayment.
#[account]
#[derive(InitSpace)]
pub struct Treasury {
    pub chama: Pubkey,
    /// Cumulative USDT deposited into the treasury.
    pub total_pooled: u64,
    /// Currently lendable USDT.
    pub available_liquidity: u64,
    pub total_loaned_out: u64,
    /// Cumulative repayments (principal + interest), reflecting treasury growth.
    pub total_repaid: u64,
    /// Monotonic counter used to derive loan PDAs.
    pub loan_count: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace, Debug)]
pub enum LoanStatus {
    Pending,
    Active,
    Repaid,
    Defaulted,
}

#[account]
#[derive(InitSpace)]
pub struct LoanRecord {
    pub chama: Pubkey,
    pub borrower: Pubkey,
    pub loan_id: u64,
    pub amount: u64,
    pub interest_bps: u16,
    /// principal + interest, due in full at maturity.
    pub amount_due: u64,
    pub duration_secs: i64,
    pub status: LoanStatus,
    pub approved_by: Option<Pubkey>,
    pub requested_at: i64,
    pub approved_at: i64,
    pub due_at: i64,
    pub bump: u8,
}

/// Maximum loan a member qualifies for, based on reputation tier applied
/// to how much they have contributed. Higher trust unlocks more leverage.
pub fn max_loan_for(total_contributed: u64, score: u16) -> u64 {
    let multiplier: u64 = if score >= 80 {
        3
    } else if score >= 60 {
        2
    } else {
        0
    };
    total_contributed.saturating_mul(multiplier)
}

impl Reputation {
    pub fn reward(&mut self, amount: u16) {
        self.score = (self.score + amount).min(crate::constants::MAX_REPUTATION);
    }

    pub fn penalize(&mut self, amount: u16) {
        self.score = self.score.saturating_sub(amount);
    }
}
