//! End-to-end LiteSVM tests for the core money paths:
//!   * contribute  (USDT in, CHM minted, cycle vault funded, reputation reward)
//!   * payout      (full pool released to the rotation recipient)
//!   * lending     (request -> approve/disburse -> repay with interest)
//!
//! These load the compiled program (`target/deploy/chamachain.so`) into an
//! in-memory SVM and drive it with real transactions, so they exercise the
//! actual SBF bytecode rather than a host-compiled copy.

// `solana_sdk::system_instruction` is deprecated in favor of a split-out crate,
// but it still works and avoids adding another dependency just for tests.
#![allow(deprecated)]

use anchor_lang::{AccountDeserialize, InstructionData, ToAccountMetas};
use litesvm::LiteSVM;
use solana_sdk::{
    instruction::Instruction,
    program_pack::Pack,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_instruction,
    transaction::Transaction,
};

use chamachain::constants::*;

// 6-decimal units (USDT / CHM share both use 6 decimals).
const USDT: u64 = 1_000_000;

fn program_so_path() -> String {
    // tests run with CWD = programs/chamachain; the .so lives at the workspace root.
    format!("{}/../../target/deploy/chamachain.so", env!("CARGO_MANIFEST_DIR"))
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

fn send(
    svm: &mut LiteSVM,
    ix: Instruction,
    payer: &Keypair,
    signers: &[&Keypair],
) -> Result<(), String> {
    let mut all: Vec<&Keypair> = vec![payer];
    all.extend_from_slice(signers);
    let bh = svm.latest_blockhash();
    let tx = Transaction::new_signed_with_payer(&[ix], Some(&payer.pubkey()), &all, bh);
    svm.send_transaction(tx)
        .map(|_| ())
        .map_err(|e| format!("{:?}\nlogs:\n{}", e.err, e.meta.logs.join("\n")))
}

fn fetch<T: AccountDeserialize>(svm: &LiteSVM, key: &Pubkey) -> T {
    let acc = svm.get_account(key).expect("account exists");
    T::try_deserialize(&mut acc.data.as_slice()).expect("deserialize")
}

fn token_amount(svm: &LiteSVM, ata: &Pubkey) -> u64 {
    let acc = svm.get_account(ata).expect("token account exists");
    spl_token::state::Account::unpack(&acc.data).expect("unpack token account").amount
}

/// Directly raise a reputation score (Reputation layout: 8 disc + 32 owner,
/// then `score: u16` at offset 40). Lets us reach the loan threshold without
/// simulating many contribution cycles.
fn set_reputation_score(svm: &mut LiteSVM, rep: &Pubkey, score: u16) {
    let mut acc = svm.get_account(rep).expect("reputation exists");
    acc.data[40..42].copy_from_slice(&score.to_le_bytes());
    svm.set_account(*rep, acc).expect("set reputation");
}

fn ata(owner: &Pubkey, mint: &Pubkey) -> Pubkey {
    spl_associated_token_account::get_associated_token_address(owner, mint)
}

// ---------------------------------------------------------------------------
// PDA derivations
// ---------------------------------------------------------------------------

fn pda(seeds: &[&[u8]]) -> Pubkey {
    Pubkey::find_program_address(seeds, &chamachain::ID).0
}

fn config_pda() -> Pubkey { pda(&[CONFIG_SEED]) }
fn mint_auth_pda() -> Pubkey { pda(&[MINT_AUTH_SEED]) }
fn chm_mint_pda() -> Pubkey { pda(&[CHM_MINT_SEED]) }
fn chama_pda(creator: &Pubkey, id: u64) -> Pubkey {
    pda(&[CHAMA_SEED, creator.as_ref(), &id.to_le_bytes()])
}
fn treasury_pda(chama: &Pubkey) -> Pubkey { pda(&[TREASURY_SEED, chama.as_ref()]) }
fn cycle_vault_pda(chama: &Pubkey) -> Pubkey { pda(&[CYCLE_VAULT_SEED, chama.as_ref()]) }
fn treasury_vault_pda(chama: &Pubkey) -> Pubkey { pda(&[TREASURY_VAULT_SEED, chama.as_ref()]) }
fn member_pda(chama: &Pubkey, owner: &Pubkey) -> Pubkey {
    pda(&[MEMBER_SEED, chama.as_ref(), owner.as_ref()])
}
fn reputation_pda(owner: &Pubkey) -> Pubkey { pda(&[REPUTATION_SEED, owner.as_ref()]) }
fn loan_pda(chama: &Pubkey, loan_id: u64) -> Pubkey {
    pda(&[LOAN_SEED, chama.as_ref(), &loan_id.to_le_bytes()])
}

// ---------------------------------------------------------------------------
// SPL token setup helpers (mock USDT)
// ---------------------------------------------------------------------------

/// Create a fresh 6-decimal mint whose authority is `authority`.
fn create_mint(svm: &mut LiteSVM, payer: &Keypair, authority: &Pubkey) -> Pubkey {
    let mint = Keypair::new();
    let rent = svm.minimum_balance_for_rent_exemption(spl_token::state::Mint::LEN);
    let create = system_instruction::create_account(
        &payer.pubkey(),
        &mint.pubkey(),
        rent,
        spl_token::state::Mint::LEN as u64,
        &spl_token::id(),
    );
    let init = spl_token::instruction::initialize_mint2(
        &spl_token::id(),
        &mint.pubkey(),
        authority,
        None,
        TOKEN_DECIMALS,
    )
    .unwrap();
    let bh = svm.latest_blockhash();
    let tx = Transaction::new_signed_with_payer(
        &[create, init],
        Some(&payer.pubkey()),
        &[payer, &mint],
        bh,
    );
    svm.send_transaction(tx).expect("create mint");
    mint.pubkey()
}

/// Create `owner`'s ATA for `mint` and mint `amount` into it (mint authority signs).
fn fund_token(
    svm: &mut LiteSVM,
    payer: &Keypair,
    mint: &Pubkey,
    mint_authority: &Keypair,
    owner: &Pubkey,
    amount: u64,
) -> Pubkey {
    let create_ata =
        spl_associated_token_account::instruction::create_associated_token_account(
            &payer.pubkey(),
            owner,
            mint,
            &spl_token::id(),
        );
    let dest = ata(owner, mint);
    let mint_to = spl_token::instruction::mint_to(
        &spl_token::id(),
        mint,
        &dest,
        &mint_authority.pubkey(),
        &[],
        amount,
    )
    .unwrap();
    let bh = svm.latest_blockhash();
    let tx = Transaction::new_signed_with_payer(
        &[create_ata, mint_to],
        Some(&payer.pubkey()),
        &[payer, mint_authority],
        bh,
    );
    svm.send_transaction(tx).expect("fund token");
    dest
}

// ---------------------------------------------------------------------------
// Shared scenario setup
// ---------------------------------------------------------------------------

/// A 2-member chama, protocol initialized, both members funded with USDT.
struct Env {
    svm: LiteSVM,
    usdt_mint: Pubkey,
    creator: Keypair, // member A, join_index 0
    member: Keypair,  // member B, join_index 1
    chama: Pubkey,
}

const CHAMA_ID: u64 = 1;

fn setup(contribution: u64) -> Env {
    let mut svm = LiteSVM::new().with_log_bytes_limit(None);
    svm.add_program_from_file(chamachain::ID, program_so_path())
        .expect("load program");

    let usdt_auth = Keypair::new();
    let creator = Keypair::new();
    let member = Keypair::new();
    for kp in [&usdt_auth, &creator, &member] {
        svm.airdrop(&kp.pubkey(), 100 * 1_000_000_000).unwrap();
    }

    let usdt_mint = create_mint(&mut svm, &usdt_auth, &usdt_auth.pubkey());

    // ---- initialize_protocol (authority = usdt_auth) ----
    let ix = Instruction {
        program_id: chamachain::ID,
        accounts: chamachain::accounts::InitializeProtocol {
            authority: usdt_auth.pubkey(),
            config: config_pda(),
            mint_authority: mint_auth_pda(),
            chm_mint: chm_mint_pda(),
            usdt_mint,
            token_program: spl_token::id(),
            system_program: solana_sdk::system_program::id(),
            rent: solana_sdk::sysvar::rent::id(),
        }
        .to_account_metas(None),
        data: chamachain::instruction::InitializeProtocol {}.data(),
    };
    send(&mut svm, ix, &usdt_auth, &[]).expect("initialize_protocol");

    // ---- reputation for both members ----
    for kp in [&creator, &member] {
        let ix = Instruction {
            program_id: chamachain::ID,
            accounts: chamachain::accounts::InitializeReputation {
                owner: kp.pubkey(),
                reputation: reputation_pda(&kp.pubkey()),
                system_program: solana_sdk::system_program::id(),
            }
            .to_account_metas(None),
            data: chamachain::instruction::InitializeReputation {}.data(),
        };
        send(&mut svm, ix, kp, &[]).expect("initialize_reputation");
    }

    let chama = chama_pda(&creator.pubkey(), CHAMA_ID);

    // ---- create_chama (creator auto-joins as index 0) ----
    let ix = Instruction {
        program_id: chamachain::ID,
        accounts: chamachain::accounts::CreateChama {
            creator: creator.pubkey(),
            config: config_pda(),
            usdt_mint,
            chama,
            treasury: treasury_pda(&chama),
            cycle_vault: cycle_vault_pda(&chama),
            treasury_vault: treasury_vault_pda(&chama),
            creator_member: member_pda(&chama, &creator.pubkey()),
            creator_reputation: reputation_pda(&creator.pubkey()),
            token_program: spl_token::id(),
            system_program: solana_sdk::system_program::id(),
            rent: solana_sdk::sysvar::rent::id(),
        }
        .to_account_metas(None),
        data: chamachain::instruction::CreateChama {
            id: CHAMA_ID,
            name: "Test Chama".to_string(),
            contribution_amount: contribution,
            // Large window so all contributions count as on-time.
            cycle_duration_secs: 30 * SECONDS_PER_DAY,
            max_members: 2,
        }
        .data(),
    };
    send(&mut svm, ix, &creator, &[]).expect("create_chama");

    // ---- join_chama (member B as index 1) ----
    let ix = Instruction {
        program_id: chamachain::ID,
        accounts: chamachain::accounts::JoinChama {
            joiner: member.pubkey(),
            chama,
            member: member_pda(&chama, &member.pubkey()),
            reputation: reputation_pda(&member.pubkey()),
            system_program: solana_sdk::system_program::id(),
        }
        .to_account_metas(None),
        data: chamachain::instruction::JoinChama {}.data(),
    };
    send(&mut svm, ix, &member, &[]).expect("join_chama");

    // ---- fund both members with USDT ----
    fund_token(&mut svm, &usdt_auth, &usdt_mint, &usdt_auth, &creator.pubkey(), 100 * USDT);
    fund_token(&mut svm, &usdt_auth, &usdt_mint, &usdt_auth, &member.pubkey(), 100 * USDT);

    Env { svm, usdt_mint, creator, member, chama }
}

impl Env {
    fn contribute_ix(&self, who: &Keypair) -> Instruction {
        Instruction {
            program_id: chamachain::ID,
            accounts: chamachain::accounts::Contribute {
                contributor: who.pubkey(),
                config: config_pda(),
                chama: self.chama,
                member: member_pda(&self.chama, &who.pubkey()),
                owner: who.pubkey(),
                reputation: reputation_pda(&who.pubkey()),
                usdt_mint: self.usdt_mint,
                chm_mint: chm_mint_pda(),
                mint_authority: mint_auth_pda(),
                contributor_usdt_ata: ata(&who.pubkey(), &self.usdt_mint),
                contributor_chm_ata: ata(&who.pubkey(), &chm_mint_pda()),
                cycle_vault: cycle_vault_pda(&self.chama),
                associated_token_program: spl_associated_token_account::id(),
                token_program: spl_token::id(),
                system_program: solana_sdk::system_program::id(),
            }
            .to_account_metas(None),
            data: chamachain::instruction::Contribute {}.data(),
        }
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[test]
fn contribute_then_payout() {
    let mut env = setup(USDT); // 1 USDT contribution
    let chama = env.chama;
    let creator_pk = env.creator.pubkey();
    let member_pk = env.member.pubkey();
    let cycle_vault = cycle_vault_pda(&chama);
    let chm_mint = chm_mint_pda();

    // Both members contribute -> cycle fully funded.
    let ix = env.contribute_ix(&env.creator);
    send(&mut env.svm, ix, &env.creator, &[]).expect("creator contribute");
    let ix = env.contribute_ix(&env.member);
    send(&mut env.svm, ix, &env.member, &[]).expect("member contribute");

    // Cycle vault holds the full pool; each member minted CHM 1:1.
    assert_eq!(token_amount(&env.svm, &cycle_vault), 2 * USDT, "pool funded");
    assert_eq!(token_amount(&env.svm, &ata(&creator_pk, &chm_mint)), USDT, "creator CHM");
    assert_eq!(token_amount(&env.svm, &ata(&member_pk, &chm_mint)), USDT, "member CHM");

    let m: chamachain::state::Member = fetch(&env.svm, &member_pda(&chama, &creator_pk));
    assert_eq!(m.total_contributed, USDT);
    let rep: chamachain::state::Reputation = fetch(&env.svm, &reputation_pda(&creator_pk));
    assert_eq!(rep.score, STARTING_REPUTATION + REP_ON_TIME_CONTRIBUTION, "on-time reward");

    // Payout to the first recipient (creator, join_index 0).
    let creator_usdt_before = token_amount(&env.svm, &ata(&creator_pk, &env.usdt_mint));
    let ix = Instruction {
        program_id: chamachain::ID,
        accounts: chamachain::accounts::Payout {
            caller: creator_pk,
            chama,
            recipient_member: member_pda(&chama, &creator_pk),
            cycle_vault,
            recipient_usdt_ata: ata(&creator_pk, &env.usdt_mint),
            token_program: spl_token::id(),
        }
        .to_account_metas(None),
        data: chamachain::instruction::Payout {}.data(),
    };
    send(&mut env.svm, ix, &env.creator, &[]).expect("payout");

    // Recipient received the whole pool; vault drained; rotation advanced.
    assert_eq!(
        token_amount(&env.svm, &ata(&creator_pk, &env.usdt_mint)),
        creator_usdt_before + 2 * USDT,
        "recipient paid full pool",
    );
    assert_eq!(token_amount(&env.svm, &cycle_vault), 0, "vault drained");
    let c: chamachain::state::Chama = fetch(&env.svm, &chama);
    assert_eq!(c.payout_index, 1, "rotation advanced");
    assert_eq!(c.current_cycle, 2, "next cycle opened");
}

#[test]
fn loan_request_approve_repay() {
    let mut env = setup(USDT);
    let chama = env.chama;
    let creator_pk = env.creator.pubkey();
    let borrower_pk = env.member.pubkey();
    let treasury = treasury_pda(&chama);
    let treasury_vault = treasury_vault_pda(&chama);
    let borrower_usdt = ata(&borrower_pk, &env.usdt_mint);

    // Borrower contributes once so they have a contribution base for max_loan.
    // (creator contributes too, but that's irrelevant to this path.)
    let ix = env.contribute_ix(&env.member);
    send(&mut env.svm, ix, &env.member, &[]).expect("borrower contribute");

    // Fund the treasury with lendable liquidity (creator deposits 10 USDT).
    let ix = Instruction {
        program_id: chamachain::ID,
        accounts: chamachain::accounts::DepositToTreasury {
            depositor: creator_pk,
            config: config_pda(),
            chama,
            member: member_pda(&chama, &creator_pk),
            treasury,
            usdt_mint: env.usdt_mint,
            chm_mint: chm_mint_pda(),
            mint_authority: mint_auth_pda(),
            depositor_usdt_ata: ata(&creator_pk, &env.usdt_mint),
            depositor_chm_ata: ata(&creator_pk, &chm_mint_pda()),
            treasury_vault,
            associated_token_program: spl_associated_token_account::id(),
            token_program: spl_token::id(),
            system_program: solana_sdk::system_program::id(),
        }
        .to_account_metas(None),
        data: chamachain::instruction::DepositToTreasury { amount: 10 * USDT }.data(),
    };
    send(&mut env.svm, ix, &env.creator, &[]).expect("deposit_to_treasury");
    assert_eq!(token_amount(&env.svm, &treasury_vault), 10 * USDT, "treasury funded");

    // Lift borrower reputation above the loan threshold (score >= 60).
    set_reputation_score(&mut env.svm, &reputation_pda(&borrower_pk), 80);

    // ---- request_loan: 2 USDT for 30 days (loan_id 0) ----
    let loan_amount = 2 * USDT;
    let loan = loan_pda(&chama, 0);
    let ix = Instruction {
        program_id: chamachain::ID,
        accounts: chamachain::accounts::RequestLoan {
            borrower: borrower_pk,
            chama,
            member: member_pda(&chama, &borrower_pk),
            reputation: reputation_pda(&borrower_pk),
            treasury,
            loan,
            system_program: solana_sdk::system_program::id(),
        }
        .to_account_metas(None),
        data: chamachain::instruction::RequestLoan { amount: loan_amount, duration_days: 30 }.data(),
    };
    send(&mut env.svm, ix, &env.member, &[]).expect("request_loan");

    let lr: chamachain::state::LoanRecord = fetch(&env.svm, &loan);
    assert_eq!(lr.amount, loan_amount);
    let expected_due = loan_amount + loan_amount * LOAN_INTEREST_BPS as u64 / BPS_DENOMINATOR;
    assert_eq!(lr.amount_due, expected_due, "principal + 5% interest");

    // ---- approve_loan: creator disburses principal to borrower ----
    let borrower_before = token_amount(&env.svm, &borrower_usdt);
    let ix = Instruction {
        program_id: chamachain::ID,
        accounts: chamachain::accounts::ApproveLoan {
            creator: creator_pk,
            chama,
            treasury,
            loan,
            borrower_member: member_pda(&chama, &borrower_pk),
            treasury_vault,
            borrower_usdt_ata: borrower_usdt,
            token_program: spl_token::id(),
        }
        .to_account_metas(None),
        data: chamachain::instruction::ApproveLoan { loan_id: 0 }.data(),
    };
    send(&mut env.svm, ix, &env.creator, &[]).expect("approve_loan");

    assert_eq!(
        token_amount(&env.svm, &borrower_usdt),
        borrower_before + loan_amount,
        "principal disbursed",
    );
    assert_eq!(token_amount(&env.svm, &treasury_vault), 10 * USDT - loan_amount, "treasury debited");
    let t: chamachain::state::Treasury = fetch(&env.svm, &treasury);
    assert_eq!(t.available_liquidity, 10 * USDT - loan_amount);
    let bm: chamachain::state::Member = fetch(&env.svm, &member_pda(&chama, &borrower_pk));
    assert_eq!(bm.active_loan, Some(loan), "active loan recorded");

    // ---- repay_loan: borrower repays principal + interest ----
    let ix = Instruction {
        program_id: chamachain::ID,
        accounts: chamachain::accounts::RepayLoan {
            borrower: borrower_pk,
            chama,
            treasury,
            loan,
            member: member_pda(&chama, &borrower_pk),
            reputation: reputation_pda(&borrower_pk),
            treasury_vault,
            borrower_usdt_ata: borrower_usdt,
            token_program: spl_token::id(),
        }
        .to_account_metas(None),
        data: chamachain::instruction::RepayLoan { loan_id: 0 }.data(),
    };
    send(&mut env.svm, ix, &env.member, &[]).expect("repay_loan");

    // Treasury grew by principal + interest; loan closed; reputation rewarded.
    assert_eq!(
        token_amount(&env.svm, &treasury_vault),
        10 * USDT - loan_amount + expected_due,
        "treasury repaid with interest",
    );
    let t: chamachain::state::Treasury = fetch(&env.svm, &treasury);
    assert_eq!(t.available_liquidity, 10 * USDT - loan_amount + expected_due);
    assert_eq!(t.total_repaid, expected_due);
    let lr: chamachain::state::LoanRecord = fetch(&env.svm, &loan);
    assert!(matches!(lr.status, chamachain::state::LoanStatus::Repaid), "loan marked repaid");
    let bm: chamachain::state::Member = fetch(&env.svm, &member_pda(&chama, &borrower_pk));
    assert_eq!(bm.active_loan, None, "active loan cleared");
    let rep: chamachain::state::Reputation = fetch(&env.svm, &reputation_pda(&borrower_pk));
    assert_eq!(rep.loans_repaid, 1);
    assert_eq!(rep.score, 80 + REP_LOAN_REPAID, "repayment reward");
}
