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
export interface ISupplyChainState {
    action: BigNumber;
    asset: BigNumber;
    creator: string;
    operatorRole: BigNumber;
    ownerRole: BigNumber;
    partOf: BigNumber;
};
export interface ISupplyChain extends ITruffleContract {
    totalAssets: () => Promise<BigNumber>;
    lastStates: (state: BigNumber) => Promise<BigNumber>;
    states: (state: BigNumber) => Promise<ISupplyChainState>;
    addAction: (actionDescription: string, options: object) => Promise<BigNumber>;
    actionDescription: (action: BigNumber) => Promise<string>;
    totalActions: () => Promise<BigNumber>;
    totalStates: () => Promise<BigNumber>;
    isAsset: (asset: BigNumber) => Promise<boolean>;
    getPrecedents: (state: BigNumber) => Promise<BigNumber[]>;
    getPartOf: (asset: BigNumber) => Promise<BigNumber>;
    getComposite: (asset: BigNumber) => Promise<BigNumber>;
    countParts: (asset: BigNumber) => Promise<BigNumber>;
    getParts: (asset: BigNumber) => Promise<BigNumber[]>;
    getOperatorRole: (asset: BigNumber) => Promise<BigNumber>;
    getOwnerRole: (asset: BigNumber) => Promise<BigNumber>;
    isOperator: (address: string, asset: BigNumber) => Promise<boolean>;
    isOwner: (address: string, asset: BigNumber) => Promise<boolean>;
    pushState: (
        action: BigNumber,
        asset: BigNumber,
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
        asset: BigNumber,
        precedentAssets: BigNumber[],
        options: object,
    ) => Promise<void>;
    addHandoverState: (
        action: BigNumber,
        asset: BigNumber,
        operatorRole: BigNumber,
        ownerRole: BigNumber,
        options: object,
    ) => Promise<void>;
    addPartOfState: (
        action: BigNumber,
        asset: BigNumber,
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
