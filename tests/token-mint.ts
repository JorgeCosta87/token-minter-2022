import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { TokenMint } from "../target/types/token_mint";
import { getMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { expect } from "chai";

describe("token-mint", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env(); 
  anchor.setProvider(provider);

  const program = anchor.workspace.tokenMint as Program<TokenMint>;

  const mintKeypair = new anchor.web3.Keypair();

  const metadata = {
    "name": "TANGAROO",
    "symbol": "TAGOO",
    uri: '',
  };

  const mint_decimals = 9;
  const mint_amount = 1_000_000_000

  it('Create an SPL token with MetadataPointer and Token metadata extensions.', async () => {
    const tx = await program.methods
      .createMint(metadata, mint_decimals)
      .accounts({ mint: mintKeypair.publicKey })
      .signers([mintKeypair])
      .rpc();
    console.log('Your transaction signature', tx);

    await program.provider.connection.confirmTransaction(tx, 'confirmed');

    const mintInfo = await getMint(
      program.provider.connection,
      mintKeypair.publicKey,
      'confirmed',
      TOKEN_2022_PROGRAM_ID
    );

    expect(mintInfo.address.toBase58()).to.equal(mintKeypair.publicKey.toBase58())
    expect(mintInfo.decimals).to.equal(mint_decimals)
    expect(Number(mintInfo.supply)).to.equal(0)
    expect(mintInfo.mintAuthority.toBase58()).to.equal(provider.publicKey.toBase58())
    expect(mintInfo.freezeAuthority.toBase58()).to.equal(provider.publicKey.toBase58())
  });

  it('Mint tokens.', async () => {
    const tx = await program.methods
      .mintToken(new BN(mint_amount))
      .accounts({
        mintAuthority: provider.publicKey,
        mintAccount: mintKeypair.publicKey,
        recipient: provider.publicKey
      })
      .rpc();
    console.log('Your transaction signature', tx);
  
    await program.provider.connection.confirmTransaction(tx, 'confirmed');
  
    const mintInfo = await getMint(
      program.provider.connection,
      mintKeypair.publicKey,
      'confirmed',
      TOKEN_2022_PROGRAM_ID
    );

    expect(mintInfo.address.toBase58()).to.equal(mintKeypair.publicKey.toBase58())
    expect(Number(mintInfo.supply)).to.equal(mint_amount)
    expect(mintInfo.mintAuthority.toBase58()).to.equal(provider.publicKey.toBase58())
    expect(mintInfo.freezeAuthority.toBase58()).to.equal(provider.publicKey.toBase58())
  });
});
