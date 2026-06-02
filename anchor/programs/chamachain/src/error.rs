use anchor_lang::prelude::*;

#[error_code]
pub enum ChamaError {
    #[msg("Chama name exceeds the maximum length")]
    NameTooLong,
    #[msg("Member count must be between the allowed minimum and maximum")]
    InvalidMemberCount,
    #[msg("Contribution amount must be greater than zero")]
    InvalidContributionAmount,
    #[msg("This chama is full")]
    ChamaFull,
    #[msg("This chama is not active")]
    ChamaNotActive,
    #[msg("Members can only join before the first contribution cycle begins")]
    JoinWindowClosed,
    #[msg("This member has already contributed for the current cycle")]
    AlreadyContributed,
    #[msg("Not all members have contributed for this cycle yet")]
    CycleNotFunded,
    #[msg("This account is not the designated recipient for the current cycle")]
    NotCurrentRecipient,
    #[msg("This member has already received their payout")]
    AlreadyPaidOut,
    #[msg("The cycle deadline has not passed yet")]
    DeadlineNotReached,
    #[msg("This member has already been processed for the current cycle")]
    AlreadyProcessed,
    #[msg("Deposit amount must be greater than zero")]
    InvalidDepositAmount,
    #[msg("Reputation is below the minimum required to borrow")]
    InsufficientReputation,
    #[msg("Borrower already has an active loan")]
    ActiveLoanExists,
    #[msg("Requested amount exceeds the borrower's maximum loan")]
    ExceedsMaxLoan,
    #[msg("Requested amount exceeds available treasury liquidity")]
    InsufficientLiquidity,
    #[msg("Loan amount must be greater than zero")]
    InvalidLoanAmount,
    #[msg("Loan duration is out of the allowed range")]
    InvalidLoanDuration,
    #[msg("Loan is not in the required state for this action")]
    InvalidLoanStatus,
    #[msg("Only the chama creator can approve loans")]
    Unauthorized,
    #[msg("The loan is not yet due")]
    LoanNotDue,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
