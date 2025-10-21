declare module 'blockcypher' {
  interface BlockCypherConfig {
    currency: string;
    network: string;
    token?: string;
  }

  interface AddressData {
    address: string;
    total_received: number;
    balance: number;
    txrefs?: Array<{
      tx_hash: string;
      block_height: number;
      confirmations: number;
      value: number;
    }>;
  }

  interface WebhookConfig {
    event: string;
    address: string;
    url: string;
  }

  class BlockCypher {
    constructor(config: BlockCypherConfig);
    genAddr(): Promise<{ address: string }>;
    getAddrFull(address: string): Promise<AddressData>;
    createHook(config: WebhookConfig): Promise<any>;
  }

  export = BlockCypher;
}