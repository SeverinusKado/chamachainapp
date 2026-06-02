use anchor_lang::prelude::*;

/// CHM share token has the same decimals as the mock USDT mint (6),
/// so CHM can be minted 1:1 against USDT contributions.
pub const TOKEN_DECIMALS: u8 = 6;

// ---------- Reputation ----------
/// Every member starts at a neutral 50/100.
pub const STARTING_REPUTATION: u16 = 50;
pub const MAX_REPUTATION: u16 = 100;
/// Minimum reputation required to request a loan.
pub const MIN_LOAN_REPUTATION: u16 = 60;

pub const REP_ON_TIME_CONTRIBUTION: u16 = 2;
pub const REP_CONTRIBUTION_DEFAULT_PENALTY: u16 = 10;
pub const REP_LOAN_REPAID: u16 = 5;
pub const REP_LOAN_DEFAULT_PENALTY: u16 = 20;

// ---------- Lending ----------
/// Flat interest charged on a loan, in basis points (5%).
pub const LOAN_INTEREST_BPS: u16 = 500;
pub const BPS_DENOMINATOR: u64 = 10_000;
pub const MAX_LOAN_DURATION_DAYS: u16 = 365;
pub const SECONDS_PER_DAY: i64 = 86_400;

// ---------- Chama bounds ----------
pub const MIN_MEMBERS: u8 = 2;
pub const MAX_MEMBERS: u8 = 50;
pub const MAX_NAME_LEN: usize = 64;

// ---------- PDA seeds ----------
#[constant]
pub const CONFIG_SEED: &[u8] = b"config";
#[constant]
pub const MINT_AUTH_SEED: &[u8] = b"mint_authority";
#[constant]
pub const CHM_MINT_SEED: &[u8] = b"chm_mint";
#[constant]
pub const CHAMA_SEED: &[u8] = b"chama";
#[constant]
pub const MEMBER_SEED: &[u8] = b"member";
#[constant]
pub const REPUTATION_SEED: &[u8] = b"reputation";
#[constant]
pub const TREASURY_SEED: &[u8] = b"treasury";
#[constant]
pub const CYCLE_VAULT_SEED: &[u8] = b"cycle_vault";
#[constant]
pub const TREASURY_VAULT_SEED: &[u8] = b"treasury_vault";
#[constant]
pub const LOAN_SEED: &[u8] = b"loan";
