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
    totalItems: () => Promise<number>;
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
        options: object,
    ) => Promise<void>;
    addRootState: (
        action: BigNumber,
        operatorRole: BigNumber,
        ownerRole: BigNumber,
        options: object,
    ) => Promise<void>;
    addInfoState: (
        action: BigNumber,
        item: BigNumber,
        precedentItems: BigNumber[],
        options: object,
    ) => Promise<void>;
    addHandoverState: (
        action: BigNumber,
        item: BigNumber,
        operatorRole: BigNumber,
        ownerRole: BigNumber,
        options: object,
    ) => Promise<void>;
    addPartOfState: (
        action: BigNumber,
        item: BigNumber,
        partOf: BigNumber,
        options: object,
    ) => Promise<void>;
}

/**
 * RBAC contract interface definition
 */
export interface IRBAC extends ITruffleContract {
    roles: (roleId: BigNumber) => Promise<{ description: string, admin: BigNumber, bearers: string[] }>;
    addRootRole: (roleDescription: string, options: object) => Promise<BigNumber>;
    addRole: (roleDescription: string, admin: BigNumber, options: object) => Promise<BigNumber>;
    totalRoles: () => Promise<BigNumber>;
    hasRole: (account: string, role: BigNumber) => Promise<boolean>;
    addBearer: (account: string, role: BigNumber, options: object) => Promise<void>;
    removeBearer: (account: string, role: BigNumber, options: object) => Promise<void>;
}
