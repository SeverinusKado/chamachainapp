use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::constants::*;
use crate::state::*;

/// One-time protocol setup: creates the global Config and the CHM share-token
/// mint whose authority is a program PDA. The mock USDT mint is created
/// off-program (a 6-decimal SPL token) and registered here.
#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    /// PDA that owns the CHM mint authority. Holds no data.
    /// CHECK: validated purely by its PDA seeds; used only as a signer.
    #[account(seeds = [MINT_AUTH_SEED], bump)]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        seeds = [CHM_MINT_SEED],
        bump,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = mint_authority,
    )]
    pub chm_mint: Account<'info, Mint>,

    /// Mock USDT mint (created off-program, 6 decimals).
    pub usdt_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.authority = ctx.accounts.authority.key();
    config.usdt_mint = ctx.accounts.usdt_mint.key();
    config.chm_mint = ctx.accounts.chm_mint.key();
    config.bump = ctx.bumps.config;
    config.mint_authority_bump = ctx.bumps.mint_authority;
    Ok(())
}

/// Creates the caller's global reputation record (score 50). Called once per
/// wallet before it can create or join a chama.
#[derive(Accounts)]
pub struct InitializeReputation<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + Reputation::INIT_SPACE,
        seeds = [REPUTATION_SEED, owner.key().as_ref()],
        bump
    )]
    pub reputation: Account<'info, Reputation>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_reputation(ctx: Context<InitializeReputation>) -> Result<()> {
    let rep = &mut ctx.accounts.reputation;
    rep.owner = ctx.accounts.owner.key();
    rep.score = STARTING_REPUTATION;
    rep.on_time_contributions = 0;
    rep.contribution_defaults = 0;
    rep.loans_repaid = 0;
    rep.loans_defaulted = 0;
    rep.bump = ctx.bumps.reputation;
    Ok(())
}
