/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/chamachain.json`.
 */
export type Chamachain = {
  "address": "8gkPp9gCALdkTvzPVk6LjVw4TRg6iKkzaRLU465y9Gye",
  "metadata": {
    "name": "chamachain",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "ChamaChain v2 — decentralized cooperative finance (savings, CHM share token, treasury, lending) on Solana"
  },
  "docs": [
    "ChamaChain v2 — decentralized cooperative finance on Solana.",
    "",
    "A rotating savings circle (chama) that grows into a community treasury:",
    "members contribute USDT, receive CHM share tokens, pool surplus into a",
    "shared treasury, and borrow against their reputation. The treasurer is",
    "replaced entirely by this program."
  ],
  "instructions": [
    {
      "name": "approveLoan",
      "docs": [
        "Phase 1: approval is gated to the chama creator. When Phase 2 governance",
        "ships, `execute_proposal` becomes an alternate authorized caller here."
      ],
      "discriminator": [
        223,
        27,
        77,
        138,
        94,
        172,
        21,
        209
      ],
      "accounts": [
        {
          "name": "creator",
          "signer": true,
          "relations": [
            "chama"
          ]
        },
        {
          "name": "chama",
          "relations": [
            "treasury",
            "loan",
            "borrowerMember"
          ]
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              }
            ]
          }
        },
        {
          "name": "loan",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "arg",
                "path": "loanId"
              }
            ]
          }
        },
        {
          "name": "borrowerMember",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "account",
                "path": "borrower_member.owner",
                "account": "member"
              }
            ]
          }
        },
        {
          "name": "treasuryVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              }
            ]
          }
        },
        {
          "name": "borrowerUsdtAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "borrower_member.owner",
                "account": "member"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "treasury_vault.mint",
                "account": "tokenAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "loanId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "contribute",
      "discriminator": [
        82,
        33,
        68,
        131,
        32,
        0,
        205,
        95
      ],
      "accounts": [
        {
          "name": "contributor",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "chama",
          "writable": true,
          "relations": [
            "member"
          ]
        },
        {
          "name": "member",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "account",
                "path": "contributor"
              }
            ]
          }
        },
        {
          "name": "owner",
          "relations": [
            "member"
          ]
        },
        {
          "name": "reputation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  117,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "contributor"
              }
            ]
          }
        },
        {
          "name": "usdtMint",
          "writable": true
        },
        {
          "name": "chmMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  109,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "contributorUsdtAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "contributor"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdtMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "contributorChmAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "contributor"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "chmMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "cycleVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  121,
                  99,
                  108,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              }
            ]
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createChama",
      "discriminator": [
        190,
        131,
        118,
        241,
        255,
        53,
        138,
        101
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "usdtMint"
        },
        {
          "name": "chama",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  109,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "id"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              }
            ]
          }
        },
        {
          "name": "cycleVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  121,
                  99,
                  108,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              }
            ]
          }
        },
        {
          "name": "treasuryVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              }
            ]
          }
        },
        {
          "name": "creatorMember",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "creatorReputation",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  117,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u64"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "contributionAmount",
          "type": "u64"
        },
        {
          "name": "cycleDurationSecs",
          "type": "i64"
        },
        {
          "name": "maxMembers",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositToTreasury",
      "discriminator": [
        10,
        195,
        112,
        242,
        107,
        206,
        240,
        198
      ],
      "accounts": [
        {
          "name": "depositor",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "chama",
          "relations": [
            "member",
            "treasury"
          ]
        },
        {
          "name": "member",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "account",
                "path": "depositor"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              }
            ]
          }
        },
        {
          "name": "usdtMint",
          "writable": true
        },
        {
          "name": "chmMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  109,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "depositorUsdtAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "depositor"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdtMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "depositorChmAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "depositor"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "chmMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "treasuryVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              }
            ]
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeProtocol",
      "docs": [
        "One-time setup: create global Config + the CHM mint (program-owned authority)."
      ],
      "discriminator": [
        188,
        233,
        252,
        106,
        134,
        146,
        202,
        91
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "mintAuthority",
          "docs": [
            "PDA that owns the CHM mint authority. Holds no data."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "chmMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  109,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "usdtMint",
          "docs": [
            "Mock USDT mint (created off-program, 6 decimals)."
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeReputation",
      "docs": [
        "Create the caller's global reputation record (score 50)."
      ],
      "discriminator": [
        150,
        240,
        109,
        53,
        147,
        42,
        152,
        162
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "reputation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  117,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "joinChama",
      "discriminator": [
        230,
        86,
        65,
        98,
        5,
        151,
        243,
        223
      ],
      "accounts": [
        {
          "name": "joiner",
          "writable": true,
          "signer": true
        },
        {
          "name": "chama",
          "writable": true
        },
        {
          "name": "member",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "account",
                "path": "joiner"
              }
            ]
          }
        },
        {
          "name": "reputation",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  117,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "joiner"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "markDefault",
      "discriminator": [
        182,
        231,
        123,
        132,
        66,
        208,
        137,
        139
      ],
      "accounts": [
        {
          "name": "caller",
          "signer": true
        },
        {
          "name": "chama",
          "writable": true,
          "relations": [
            "member"
          ]
        },
        {
          "name": "member",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "account",
                "path": "member.owner",
                "account": "member"
              }
            ]
          }
        },
        {
          "name": "reputation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  117,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "member.owner",
                "account": "member"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "markLoanDefault",
      "discriminator": [
        28,
        243,
        36,
        247,
        150,
        61,
        7,
        116
      ],
      "accounts": [
        {
          "name": "caller",
          "signer": true
        },
        {
          "name": "chama",
          "relations": [
            "loan",
            "member"
          ]
        },
        {
          "name": "loan",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "arg",
                "path": "loanId"
              }
            ]
          }
        },
        {
          "name": "member",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "account",
                "path": "member.owner",
                "account": "member"
              }
            ]
          }
        },
        {
          "name": "reputation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  117,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "member.owner",
                "account": "member"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "loanId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "payout",
      "discriminator": [
        149,
        140,
        194,
        236,
        174,
        189,
        6,
        239
      ],
      "accounts": [
        {
          "name": "caller",
          "signer": true
        },
        {
          "name": "chama",
          "writable": true,
          "relations": [
            "recipientMember"
          ]
        },
        {
          "name": "recipientMember",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "account",
                "path": "recipient_member.owner",
                "account": "member"
              }
            ]
          }
        },
        {
          "name": "cycleVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  121,
                  99,
                  108,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              }
            ]
          }
        },
        {
          "name": "recipientUsdtAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "recipient_member.owner",
                "account": "member"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "cycle_vault.mint",
                "account": "tokenAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "repayLoan",
      "discriminator": [
        224,
        93,
        144,
        77,
        61,
        17,
        137,
        54
      ],
      "accounts": [
        {
          "name": "borrower",
          "writable": true,
          "signer": true
        },
        {
          "name": "chama",
          "relations": [
            "treasury",
            "loan",
            "member"
          ]
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              }
            ]
          }
        },
        {
          "name": "loan",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "arg",
                "path": "loanId"
              }
            ]
          }
        },
        {
          "name": "member",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "account",
                "path": "borrower"
              }
            ]
          }
        },
        {
          "name": "reputation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  117,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "borrower"
              }
            ]
          }
        },
        {
          "name": "treasuryVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              }
            ]
          }
        },
        {
          "name": "borrowerUsdtAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "borrower"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "treasury_vault.mint",
                "account": "tokenAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "loanId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "requestLoan",
      "discriminator": [
        120,
        2,
        7,
        7,
        1,
        219,
        235,
        187
      ],
      "accounts": [
        {
          "name": "borrower",
          "writable": true,
          "signer": true
        },
        {
          "name": "chama",
          "relations": [
            "member",
            "treasury"
          ]
        },
        {
          "name": "member",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "account",
                "path": "borrower"
              }
            ]
          }
        },
        {
          "name": "reputation",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  117,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "borrower"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              }
            ]
          }
        },
        {
          "name": "loan",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "chama"
              },
              {
                "kind": "account",
                "path": "treasury.loan_count",
                "account": "treasury"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "durationDays",
          "type": "u16"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "chama",
      "discriminator": [
        92,
        211,
        237,
        100,
        10,
        157,
        139,
        147
      ]
    },
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "loanRecord",
      "discriminator": [
        172,
        12,
        31,
        200,
        122,
        175,
        169,
        67
      ]
    },
    {
      "name": "member",
      "discriminator": [
        54,
        19,
        162,
        21,
        29,
        166,
        17,
        198
      ]
    },
    {
      "name": "reputation",
      "discriminator": [
        55,
        148,
        90,
        71,
        68,
        183,
        193,
        28
      ]
    },
    {
      "name": "treasury",
      "discriminator": [
        238,
        239,
        123,
        238,
        89,
        1,
        168,
        253
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "nameTooLong",
      "msg": "Chama name exceeds the maximum length"
    },
    {
      "code": 6001,
      "name": "invalidMemberCount",
      "msg": "Member count must be between the allowed minimum and maximum"
    },
    {
      "code": 6002,
      "name": "invalidContributionAmount",
      "msg": "Contribution amount must be greater than zero"
    },
    {
      "code": 6003,
      "name": "chamaFull",
      "msg": "This chama is full"
    },
    {
      "code": 6004,
      "name": "chamaNotActive",
      "msg": "This chama is not active"
    },
    {
      "code": 6005,
      "name": "joinWindowClosed",
      "msg": "Members can only join before the first contribution cycle begins"
    },
    {
      "code": 6006,
      "name": "alreadyContributed",
      "msg": "This member has already contributed for the current cycle"
    },
    {
      "code": 6007,
      "name": "cycleNotFunded",
      "msg": "Not all members have contributed for this cycle yet"
    },
    {
      "code": 6008,
      "name": "notCurrentRecipient",
      "msg": "This account is not the designated recipient for the current cycle"
    },
    {
      "code": 6009,
      "name": "alreadyPaidOut",
      "msg": "This member has already received their payout"
    },
    {
      "code": 6010,
      "name": "deadlineNotReached",
      "msg": "The cycle deadline has not passed yet"
    },
    {
      "code": 6011,
      "name": "alreadyProcessed",
      "msg": "This member has already been processed for the current cycle"
    },
    {
      "code": 6012,
      "name": "invalidDepositAmount",
      "msg": "Deposit amount must be greater than zero"
    },
    {
      "code": 6013,
      "name": "insufficientReputation",
      "msg": "Reputation is below the minimum required to borrow"
    },
    {
      "code": 6014,
      "name": "activeLoanExists",
      "msg": "Borrower already has an active loan"
    },
    {
      "code": 6015,
      "name": "exceedsMaxLoan",
      "msg": "Requested amount exceeds the borrower's maximum loan"
    },
    {
      "code": 6016,
      "name": "insufficientLiquidity",
      "msg": "Requested amount exceeds available treasury liquidity"
    },
    {
      "code": 6017,
      "name": "invalidLoanAmount",
      "msg": "Loan amount must be greater than zero"
    },
    {
      "code": 6018,
      "name": "invalidLoanDuration",
      "msg": "Loan duration is out of the allowed range"
    },
    {
      "code": 6019,
      "name": "invalidLoanStatus",
      "msg": "Loan is not in the required state for this action"
    },
    {
      "code": 6020,
      "name": "unauthorized",
      "msg": "Only the chama creator can approve loans"
    },
    {
      "code": 6021,
      "name": "loanNotDue",
      "msg": "The loan is not yet due"
    },
    {
      "code": 6022,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "chama",
      "docs": [
        "A rotating savings circle."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "id",
            "docs": [
              "Creator-scoped id, lets one wallet run multiple chamas."
            ],
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "contributionAmount",
            "docs": [
              "Fixed contribution per member per cycle (USDT, 6 decimals)."
            ],
            "type": "u64"
          },
          {
            "name": "cycleDurationSecs",
            "type": "i64"
          },
          {
            "name": "maxMembers",
            "type": "u8"
          },
          {
            "name": "memberCount",
            "type": "u8"
          },
          {
            "name": "currentCycle",
            "docs": [
              "1-indexed cycle currently being collected."
            ],
            "type": "u16"
          },
          {
            "name": "payoutIndex",
            "docs": [
              "join_index of the next member due to receive a payout."
            ],
            "type": "u8"
          },
          {
            "name": "contributionsThisCycle",
            "docs": [
              "How many members have been accounted for (paid or defaulted) this cycle."
            ],
            "type": "u8"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "chamaStatus"
              }
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "cycleDeadline",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "chamaStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "completed"
          }
        ]
      }
    },
    {
      "name": "config",
      "docs": [
        "Global protocol configuration. One per deployment."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Authority that initialized the protocol."
            ],
            "type": "pubkey"
          },
          {
            "name": "usdtMint",
            "docs": [
              "Mock USDT mint used for all contributions and loans."
            ],
            "type": "pubkey"
          },
          {
            "name": "chmMint",
            "docs": [
              "CHM share-token mint (mint authority is the program PDA)."
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "mintAuthorityBump",
            "docs": [
              "Bump for the CHM mint-authority PDA."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "loanRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "chama",
            "type": "pubkey"
          },
          {
            "name": "borrower",
            "type": "pubkey"
          },
          {
            "name": "loanId",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "interestBps",
            "type": "u16"
          },
          {
            "name": "amountDue",
            "docs": [
              "principal + interest, due in full at maturity."
            ],
            "type": "u64"
          },
          {
            "name": "durationSecs",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "loanStatus"
              }
            }
          },
          {
            "name": "approvedBy",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "requestedAt",
            "type": "i64"
          },
          {
            "name": "approvedAt",
            "type": "i64"
          },
          {
            "name": "dueAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "loanStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "active"
          },
          {
            "name": "repaid"
          },
          {
            "name": "defaulted"
          }
        ]
      }
    },
    {
      "name": "member",
      "docs": [
        "Membership record, one per (chama, wallet)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "chama",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "joinIndex",
            "docs": [
              "Position in the payout rotation."
            ],
            "type": "u8"
          },
          {
            "name": "hasReceivedPayout",
            "type": "bool"
          },
          {
            "name": "contributionsMade",
            "type": "u16"
          },
          {
            "name": "contributionDefaults",
            "type": "u16"
          },
          {
            "name": "totalContributed",
            "type": "u64"
          },
          {
            "name": "totalChmMinted",
            "type": "u64"
          },
          {
            "name": "lastProcessedCycle",
            "docs": [
              "Last cycle this member contributed to or was defaulted on."
            ],
            "type": "u16"
          },
          {
            "name": "activeLoan",
            "docs": [
              "Set to the loan PDA while a loan is outstanding."
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "reputation",
      "docs": [
        "Per-wallet reputation, shared across every chama the wallet belongs to.",
        "This is the \"connective tissue\" updated by savings, treasury and lending."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "score",
            "docs": [
              "0..=100 score. Starts at 50."
            ],
            "type": "u16"
          },
          {
            "name": "onTimeContributions",
            "type": "u32"
          },
          {
            "name": "contributionDefaults",
            "type": "u32"
          },
          {
            "name": "loansRepaid",
            "type": "u32"
          },
          {
            "name": "loansDefaulted",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "treasury",
      "docs": [
        "Per-chama shared treasury that funds loans and grows on repayment."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "chama",
            "type": "pubkey"
          },
          {
            "name": "totalPooled",
            "docs": [
              "Cumulative USDT deposited into the treasury."
            ],
            "type": "u64"
          },
          {
            "name": "availableLiquidity",
            "docs": [
              "Currently lendable USDT."
            ],
            "type": "u64"
          },
          {
            "name": "totalLoanedOut",
            "type": "u64"
          },
          {
            "name": "totalRepaid",
            "docs": [
              "Cumulative repayments (principal + interest), reflecting treasury growth."
            ],
            "type": "u64"
          },
          {
            "name": "loanCount",
            "docs": [
              "Monotonic counter used to derive loan PDAs."
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "chamaSeed",
      "type": "bytes",
      "value": "[99, 104, 97, 109, 97]"
    },
    {
      "name": "chmMintSeed",
      "type": "bytes",
      "value": "[99, 104, 109, 95, 109, 105, 110, 116]"
    },
    {
      "name": "configSeed",
      "type": "bytes",
      "value": "[99, 111, 110, 102, 105, 103]"
    },
    {
      "name": "cycleVaultSeed",
      "type": "bytes",
      "value": "[99, 121, 99, 108, 101, 95, 118, 97, 117, 108, 116]"
    },
    {
      "name": "loanSeed",
      "type": "bytes",
      "value": "[108, 111, 97, 110]"
    },
    {
      "name": "memberSeed",
      "type": "bytes",
      "value": "[109, 101, 109, 98, 101, 114]"
    },
    {
      "name": "mintAuthSeed",
      "type": "bytes",
      "value": "[109, 105, 110, 116, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121]"
    },
    {
      "name": "reputationSeed",
      "type": "bytes",
      "value": "[114, 101, 112, 117, 116, 97, 116, 105, 111, 110]"
    },
    {
      "name": "treasurySeed",
      "type": "bytes",
      "value": "[116, 114, 101, 97, 115, 117, 114, 121]"
    },
    {
      "name": "treasuryVaultSeed",
      "type": "bytes",
      "value": "[116, 114, 101, 97, 115, 117, 114, 121, 95, 118, 97, 117, 108, 116]"
    }
  ]
};
