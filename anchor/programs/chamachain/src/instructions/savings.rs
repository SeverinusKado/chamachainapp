use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::ChamaError;
use crate::state::*;

// ------------------------------------------------------------------
// create_chama
// ------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct CreateChama<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(constraint = usdt_mint.key() == config.usdt_mint @ ChamaError::ChamaNotActive)]
    pub usdt_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        space = 8 + Chama::INIT_SPACE,
        seeds = [CHAMA_SEED, creator.key().as_ref(), &id.to_le_bytes()],
        bump
    )]
    pub chama: Account<'info, Chama>,

    #[account(
        init,
        payer = creator,
        space = 8 + Treasury::INIT_SPACE,
        seeds = [TREASURY_SEED, chama.key().as_ref()],
        bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        init,
        payer = creator,
        seeds = [CYCLE_VAULT_SEED, chama.key().as_ref()],
        bump,
        token::mint = usdt_mint,
        token::authority = chama,
    )]
    pub cycle_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        seeds = [TREASURY_VAULT_SEED, chama.key().as_ref()],
        bump,
        token::mint = usdt_mint,
        token::authority = treasury,
    )]
    pub treasury_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        space = 8 + Member::INIT_SPACE,
        seeds = [MEMBER_SEED, chama.key().as_ref(), creator.key().as_ref()],
        bump
    )]
    pub creator_member: Account<'info, Member>,

    #[account(
        seeds = [REPUTATION_SEED, creator.key().as_ref()],
        bump = creator_reputation.bump
    )]
    pub creator_reputation: Account<'info, Reputation>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_chama(
    ctx: Context<CreateChama>,
    id: u64,
    name: String,
    contribution_amount: u64,
    cycle_duration_secs: i64,
    max_members: u8,
) -> Result<()> {
    require!(name.len() <= MAX_NAME_LEN, ChamaError::NameTooLong);
    require!(
        (MIN_MEMBERS..=MAX_MEMBERS).contains(&max_members),
        ChamaError::InvalidMemberCount
    );
    require!(contribution_amount > 0, ChamaError::InvalidContributionAmount);
    require!(cycle_duration_secs > 0, ChamaError::InvalidLoanDuration);

    let now = Clock::get()?.unix_timestamp;
    let chama = &mut ctx.accounts.chama;
    chama.creator = ctx.accounts.creator.key();
    chama.id = id;
    chama.name = name;
    chama.contribution_amount = contribution_amount;
    chama.cycle_duration_secs = cycle_duration_secs;
    chama.max_members = max_members;
    chama.member_count = 1; // creator auto-joins
    chama.current_cycle = 1;
    chama.payout_index = 0;
    chama.contributions_this_cycle = 0;
    chama.status = ChamaStatus::Active;
    chama.created_at = now;
    chama.cycle_deadline = now + cycle_duration_secs;
    chama.bump = ctx.bumps.chama;

    let treasury = &mut ctx.accounts.treasury;
    treasury.chama = chama.key();
    treasury.bump = ctx.bumps.treasury;

    let member = &mut ctx.accounts.creator_member;
    member.chama = chama.key();
    member.owner = ctx.accounts.creator.key();
    member.join_index = 0;
    member.last_processed_cycle = 0;
    member.active_loan = None;
    member.bump = ctx.bumps.creator_member;

    Ok(())
}

// ------------------------------------------------------------------
// join_chama
// ------------------------------------------------------------------

#[derive(Accounts)]
pub struct JoinChama<'info> {
    #[account(mut)]
    pub joiner: Signer<'info>,

    #[account(mut)]
    pub chama: Account<'info, Chama>,

    #[account(
        init,
        payer = joiner,
        space = 8 + Member::INIT_SPACE,
        seeds = [MEMBER_SEED, chama.key().as_ref(), joiner.key().as_ref()],
        bump
    )]
    pub member: Account<'info, Member>,

    #[account(
        seeds = [REPUTATION_SEED, joiner.key().as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Account<'info, Reputation>,

    pub system_program: Program<'info, System>,
}

pub fn join_chama(ctx: Context<JoinChama>) -> Result<()> {
    let chama = &mut ctx.accounts.chama;
    require!(chama.status == ChamaStatus::Active, ChamaError::ChamaNotActive);
    require!(
        chama.member_count < chama.max_members,
        ChamaError::ChamaFull
    );
    // Everyone must join before the first contribution lands.
    require!(
        chama.current_cycle == 1 && chama.contributions_this_cycle == 0,
        ChamaError::JoinWindowClosed
    );

    let member = &mut ctx.accounts.member;
    member.chama = chama.key();
    member.owner = ctx.accounts.joiner.key();
    member.join_index = chama.member_count;
    member.last_processed_cycle = 0;
    member.active_loan = None;
    member.bump = ctx.bumps.member;

    chama.member_count += 1;
    Ok(())
}

// ------------------------------------------------------------------
// contribute
// ------------------------------------------------------------------

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut)]
    pub contributor: Signer<'info>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Box<Account<'info, Config>>,

    #[account(mut)]
    pub chama: Box<Account<'info, Chama>>,

    #[account(
        mut,
        seeds = [MEMBER_SEED, chama.key().as_ref(), contributor.key().as_ref()],
        bump = member.bump,
        has_one = chama,
        has_one = owner,
    )]
    pub member: Box<Account<'info, Member>>,

    /// CHECK: name binding for has_one = owner on `member`.
    #[account(address = contributor.key())]
    pub owner: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [REPUTATION_SEED, contributor.key().as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Box<Account<'info, Reputation>>,

    #[account(
        mut,
        address = config.usdt_mint
    )]
    pub usdt_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [CHM_MINT_SEED],
        bump,
        address = config.chm_mint
    )]
    pub chm_mint: Box<Account<'info, Mint>>,

    /// CHECK: CHM mint-authority PDA, validated by seeds; signer only.
    #[account(seeds = [MINT_AUTH_SEED], bump = config.mint_authority_bump)]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = contributor,
    )]
    pub contributor_usdt_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = contributor,
        associated_token::mint = chm_mint,
        associated_token::authority = contributor,
    )]
    pub contributor_chm_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [CYCLE_VAULT_SEED, chama.key().as_ref()],
        bump
    )]
    pub cycle_vault: Box<Account<'info, TokenAccount>>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn contribute(ctx: Context<Contribute>) -> Result<()> {
    let chama = &mut ctx.accounts.chama;
    require!(chama.status == ChamaStatus::Active, ChamaError::ChamaNotActive);

    let member = &mut ctx.accounts.member;
    require!(
        member.last_processed_cycle != chama.current_cycle,
        ChamaError::AlreadyContributed
    );

    let amount = chama.contribution_amount;

    // 1. Pull USDT contribution into the cycle vault.
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.contributor_usdt_ata.to_account_info(),
                to: ctx.accounts.cycle_vault.to_account_info(),
                authority: ctx.accounts.contributor.to_account_info(),
            },
        ),
        amount,
    )?;

    // 2. Mint CHM 1:1 as a share/receipt token.
    let mint_auth_seeds: &[&[u8]] = &[MINT_AUTH_SEED, &[ctx.accounts.config.mint_authority_bump]];
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.chm_mint.to_account_info(),
                to: ctx.accounts.contributor_chm_ata.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            &[mint_auth_seeds],
        ),
        amount,
    )?;

    // 3. Update member + cycle bookkeeping.
    member.contributions_made += 1;
    member.total_contributed = member
        .total_contributed
        .checked_add(amount)
        .ok_or(ChamaError::MathOverflow)?;
    member.total_chm_minted = member
        .total_chm_minted
        .checked_add(amount)
        .ok_or(ChamaError::MathOverflow)?;
    member.last_processed_cycle = chama.current_cycle;
    chama.contributions_this_cycle += 1;

    // 4. Reputation: reward on-time contributions only.
    let now = Clock::get()?.unix_timestamp;
    if now <= chama.cycle_deadline {
        let rep = &mut ctx.accounts.reputation;
        rep.reward(REP_ON_TIME_CONTRIBUTION);
        rep.on_time_contributions += 1;
    }

    Ok(())
}

// ------------------------------------------------------------------
// payout
// ------------------------------------------------------------------

#[derive(Accounts)]
pub struct Payout<'info> {
    pub caller: Signer<'info>,

    #[account(mut)]
    pub chama: Account<'info, Chama>,

    #[account(
        mut,
        seeds = [MEMBER_SEED, chama.key().as_ref(), recipient_member.owner.as_ref()],
        bump = recipient_member.bump,
        has_one = chama,
    )]
    pub recipient_member: Account<'info, Member>,

    #[account(
        mut,
        seeds = [CYCLE_VAULT_SEED, chama.key().as_ref()],
        bump
    )]
    pub cycle_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = cycle_vault.mint,
        associated_token::authority = recipient_member.owner,
    )]
    pub recipient_usdt_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn payout(ctx: Context<Payout>) -> Result<()> {
    let chama = &mut ctx.accounts.chama;
    require!(chama.status == ChamaStatus::Active, ChamaError::ChamaNotActive);
    require!(
        chama.contributions_this_cycle == chama.member_count,
        ChamaError::CycleNotFunded
    );

    let recipient = &mut ctx.accounts.recipient_member;
    require!(
        recipient.join_index == chama.payout_index,
        ChamaError::NotCurrentRecipient
    );
    require!(!recipient.has_received_payout, ChamaError::AlreadyPaidOut);

    // Release the entire collected pool to the recipient.
    let pool = ctx.accounts.cycle_vault.amount;
    let chama_seeds: &[&[u8]] = &[
        CHAMA_SEED,
        chama.creator.as_ref(),
        &chama.id.to_le_bytes(),
        &[chama.bump],
    ];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.cycle_vault.to_account_info(),
                to: ctx.accounts.recipient_usdt_ata.to_account_info(),
                authority: chama.to_account_info(),
            },
            &[chama_seeds],
        ),
        pool,
    )?;

    recipient.has_received_payout = true;
    chama.payout_index += 1;

    if chama.payout_index == chama.member_count {
        // Every member has received a payout — the circle is complete.
        chama.status = ChamaStatus::Completed;
    } else {
        // Begin the next collection cycle.
        chama.current_cycle += 1;
        chama.contributions_this_cycle = 0;
        let now = Clock::get()?.unix_timestamp;
        chama.cycle_deadline = now + chama.cycle_duration_secs;
    }

    Ok(())
}

// ------------------------------------------------------------------
// mark_default (missed contribution)
// ------------------------------------------------------------------

#[derive(Accounts)]
pub struct MarkDefault<'info> {
    pub caller: Signer<'info>,

    #[account(mut)]
    pub chama: Account<'info, Chama>,

    #[account(
        mut,
        seeds = [MEMBER_SEED, chama.key().as_ref(), member.owner.as_ref()],
        bump = member.bump,
        has_one = chama,
    )]
    pub member: Account<'info, Member>,

    #[account(
        mut,
        seeds = [REPUTATION_SEED, member.owner.as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Account<'info, Reputation>,
}

pub fn mark_default(ctx: Context<MarkDefault>) -> Result<()> {
    let chama = &mut ctx.accounts.chama;
    require!(chama.status == ChamaStatus::Active, ChamaError::ChamaNotActive);

    let now = Clock::get()?.unix_timestamp;
    require!(now > chama.cycle_deadline, ChamaError::DeadlineNotReached);

    let member = &mut ctx.accounts.member;
    require!(
        member.last_processed_cycle != chama.current_cycle,
        ChamaError::AlreadyProcessed
    );

    // Record the default and let the cycle proceed (the pool is just short
    // this member's share). This keeps the rotation from stalling.
    member.contribution_defaults += 1;
    member.last_processed_cycle = chama.current_cycle;
    chama.contributions_this_cycle += 1;

    let rep = &mut ctx.accounts.reputation;
    rep.penalize(REP_CONTRIBUTION_DEFAULT_PENALTY);
    rep.contribution_defaults += 1;

    Ok(())
}
