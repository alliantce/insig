/*
 * Blockchain state interface
 */
export interface IBlockchainState {
    userAccount: string;
    web3: any;
}
/**
 * Local definition of TruffleContract methods
 */
interface ITruffleContract {
    deployed: () => Promise<any>;
}
/**
 * SupplyChain contract interface definition
 */
export interface ISupplyChain extends ITruffleContract {
    addAction: (actionDescription: string, options: object) => Promise<number>;
    actionDescription: (action: number) => Promise<string>;
    totalActions: () => Promise<number>;
}
