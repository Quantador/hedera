require("dotenv").config();
const {
    AccountId,
    PrivateKey,
    Client,
    TokenCreateTransaction
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
            .setToken
    
    } catch (error) {
      console.error(error);
    } finally {
      if (client) client.close();
    }
  }

  main();