import BigNumber from 'bignumber.js';
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
    addAction: (actionDescription: string, options: object) => Promise<BigNumber>;
    actionDescription: (action: BigNumber) => Promise<string>;
    totalActions: () => Promise<BigNumber>;
    totalStates: () => Promise<BigNumber>;
    isItem: (item: BigNumber) => Promise<boolean>;
    getPrecedents: (state: BigNumber) => Promise<BigNumber[]>;
    getPartOf: (item: BigNumber) => Promise<BigNumber>;
    getComposite: (item: BigNumber) => Promise<BigNumber>;
    countParts: (item: BigNumber) => Promise<BigNumber>;
    getParts: (item: BigNumber) => Promise<BigNumber[]>;
    getOperatorRole: (item: BigNumber) => Promise<BigNumber>;
    getOwnerRole: (item: BigNumber) => Promise<BigNumber>;
    isOperator: (address: string, item: BigNumber) => Promise<boolean>;
    isOwner: (address: string, item: BigNumber) => Promise<boolean>;
    pushState: (
        action: BigNumber,
        item: BigNumber,
        precedents: BigNumber[],
        partOf: BigNumber,
        operatorRole: BigNumber,
        ownerRole: BigNumber,
    ) => void;
}

/**
 * RBAC contract interface definition
 */
export interface IRBAC extends ITruffleContract {
    roles: (roleId: BigNumber) => Promise<{description: string, admin: BigNumber, bearers: string[]}>;
    addRootRole: (roleDescription: string) => Promise<BigNumber>;
    addRole: (roleDescription: string, admin: BigNumber) => Promise<BigNumber>;
    totalRoles: () => Promise<BigNumber>;
    hasRole: (account: string, role: BigNumber) => Promise<boolean>;
    addBearer: (account: string, role: BigNumber) => void;
    removeBearer: (account: string, role: BigNumber) => void;
}
