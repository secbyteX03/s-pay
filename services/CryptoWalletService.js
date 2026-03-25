// services/CryptoWalletService.js
// Cryptocurrency wallet integration service

class CryptoWalletService {
  constructor() {
    this.wallets = new Map();
    this.transactions = new Map();
  }

  /**
   * Create a new crypto wallet for a user
   */
  static createWallet(userId, cryptoType = "XLM") {
    const walletId = `wallet_${userId}_${cryptoType}_${Date.now()}`;

    const wallet = {
      id: walletId,
      userId,
      cryptoType,
      balance: 0,
      publicAddress: generateAddress(cryptoType),
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    return wallet;
  }

  /**
   * Get wallet balance
   */
  static async getBalance(walletId) {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    return wallet.balance;
  }

  /**
   * Deposit crypto to wallet
   */
  static async deposit(walletId, amount, transactionHash) {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    wallet.balance += amount;
    wallet.lastUpdated = new Date();
    this.wallets.set(walletId, wallet);

    // Record transaction
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.transactions.set(txId, {
      id: txId,
      walletId,
      type: "deposit",
      amount,
      hash: transactionHash,
      timestamp: new Date(),
      status: "confirmed",
    });

    return { success: true, balance: wallet.balance };
  }

  /**
   * Withdraw crypto from wallet
   */
  static async withdraw(walletId, amount, destinationAddress) {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.balance < amount) {
      throw new Error("Insufficient balance");
    }

    wallet.balance -= amount;
    wallet.lastUpdated = new Date();
    this.wallets.set(walletId, wallet);

    // Record transaction
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.transactions.set(txId, {
      id: txId,
      walletId,
      type: "withdrawal",
      amount,
      destination: destinationAddress,
      timestamp: new Date(),
      status: "pending",
    });

    return { success: true, balance: wallet.balance, txId };
  }

  /**
   * Get wallet transaction history
   */
  static async getTransactionHistory(walletId) {
    const txs = [];
    for (const tx of this.transactions.values()) {
      if (tx.walletId === walletId) {
        txs.push(tx);
      }
    }
    return txs.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get supported cryptocurrencies
   */
  static getSupportedCryptos() {
    return [
      { code: "XLM", name: "Stellar Lumens", decimals: 7 },
      { code: "BTC", name: "Bitcoin", decimals: 8 },
      { code: "ETH", name: "Ethereum", decimals: 18 },
    ];
  }
}

// Generate a simple address (in production, use proper crypto libraries)
function generateAddress(cryptoType) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let address = "";

  switch (cryptoType) {
    case "XLM":
      address = "G";
      break;
    case "BTC":
      address = "1";
      break;
    case "ETH":
      address = "0x";
      break;
    default:
      address = "X";
  }

  for (let i = 0; i < (cryptoType === "ETH" ? 40 : 50); i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return address;
}

module.exports = CryptoWalletService;
