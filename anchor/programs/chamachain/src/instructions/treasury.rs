use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::ChamaError;
use crate::state::*;

/// A member deposits surplus USDT into the chama's shared treasury, growing
/// lendable liquidity, and receives CHM 1:1 as a share/receipt token.
#[derive(Accounts)]
pub struct DepositToTreasury<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Box<Account<'info, Config>>,

    pub chama: Box<Account<'info, Chama>>,

    #[account(
        mut,
        seeds = [MEMBER_SEED, chama.key().as_ref(), depositor.key().as_ref()],
        bump = member.bump,
        has_one = chama,
        constraint = member.owner == depositor.key() @ ChamaError::Unauthorized,
    )]
    pub member: Box<Account<'info, Member>>,

    #[account(
        mut,
        seeds = [TREASURY_SEED, chama.key().as_ref()],
        bump = treasury.bump,
        has_one = chama,
    )]
    pub treasury: Box<Account<'info, Treasury>>,

    #[account(mut, address = config.usdt_mint)]
    pub usdt_mint: Box<Account<'info, Mint>>,

    #[account(mut, seeds = [CHM_MINT_SEED], bump, address = config.chm_mint)]
    pub chm_mint: Box<Account<'info, Mint>>,

    /// CHECK: CHM mint-authority PDA, validated by seeds; signer only.
    #[account(seeds = [MINT_AUTH_SEED], bump = config.mint_authority_bump)]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = depositor,
    )]
    pub depositor_usdt_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = depositor,
        associated_token::mint = chm_mint,
        associated_token::authority = depositor,
    )]
    pub depositor_chm_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [TREASURY_VAULT_SEED, chama.key().as_ref()],
        bump
    )]
    pub treasury_vault: Box<Account<'info, TokenAccount>>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn deposit_to_treasury(ctx: Context<DepositToTreasury>, amount: u64) -> Result<()> {
    require!(amount > 0, ChamaError::InvalidDepositAmount);

    // 1. Move USDT into the treasury vault.
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.depositor_usdt_ata.to_account_info(),
                to: ctx.accounts.treasury_vault.to_account_info(),
                authority: ctx.accounts.depositor.to_account_info(),
            },
        ),
        amount,
    )?;

    // 2. Mint CHM 1:1.
    let mint_auth_seeds: &[&[u8]] = &[MINT_AUTH_SEED, &[ctx.accounts.config.mint_authority_bump]];
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.chm_mint.to_account_info(),
                to: ctx.accounts.depositor_chm_ata.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            &[mint_auth_seeds],
        ),
        amount,
    )?;

    // 3. Update treasury + member bookkeeping.
    let treasury = &mut ctx.accounts.treasury;
    treasury.total_pooled = treasury
        .total_pooled
        .checked_add(amount)
        .ok_or(ChamaError::MathOverflow)?;
    treasury.available_liquidity = treasury
        .available_liquidity
        .checked_add(amount)
        .ok_or(ChamaError::MathOverflow)?;

    let member = &mut ctx.accounts.member;
    member.total_chm_minted = member
        .total_chm_minted
        .checked_add(amount)
        .ok_or(ChamaError::MathOverflow)?;

    Ok(())
}
