require("dotenv").config();
const {
    AccountId,
    PrivateKey,
    Client,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    Hbar,
    TokenMintTransaction
  } = require("@hashgraph/sdk"); // v2.46.0

async function main() {
    let client;
    try {
        // Your account ID and private key from string value
        const MY_ACCOUNT_ID = AccountId.fromString(process.env.ACCOUNT_ID);
        const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(process.env.PRIVATE_KEY);

        // Pre-configured client for test network (testnet)
        client = Client.forTestnet();

        //Set the operator with the account ID and private key
        client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

        // Start your code here

        const nftCreateTransaction = new TokenCreateTransaction()
            .setTokenName("Pokemon")
            .setTokenSymbol("PKM")
            .setTokenType(TokenType.NonFungibleUnique)
            .setDecimals(0)
            .setInitialSupply(0)
            .setSupplyKey(MY_PRIVATE_KEY)
            .setTreasuryAccountId(MY_ACCOUNT_ID)
            .setSupplyType(TokenSupplyType.Finite)
            .setMaxSupply(100)
            .freezeWith(client);

        const nftCreateTxSign = await nftCreateTransaction.signWithOperator(client);
        const nftCreateSubmit = await nftCreateTxSign.execute(client);
        const nftCreateRx = await nftCreateSubmit.getReceipt(client);
        console.log("Token ID: " + nftCreateRx.tokenId.toString());
    
        const maxTransactionFee = new Hbar(20);

        const CID = "ipfs://QmUkgXEcWA1aGDVvCNvRvnL92iEW8Eq4Ww91pEFJ2Xp6pW"

        const nftMintTransaction = new TokenMintTransaction()
            .setTokenId(nftCreateRx.tokenId)
            .setMetadata([Buffer.from(CID)])
            .freezeWith(client);

        const nftMintTxSign = await nftMintTransaction.signWithOperator(client);
        const nftMintSubmit = await nftMintTxSign.execute(client);
        const nftMintRx = await nftMintSubmit.getReceipt(client);

        console.log("NFT Minted: " + nftMintRx.serials.toString());

    } catch (error) {
      console.error(error);
    } finally {
      if (client) client.close();
    }
  }

  main();