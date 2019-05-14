import truffleContract from 'truffle-contract';

import getWeb3 from '../utils/getWeb3';
import {
    IBlockchainState,
    IRBAC,
    ISupplyChain,
} from './CommonInterfaces';

import RBACJSON from '../contracts/RBAC.json';
import SupplyChainJSON from '../contracts/SupplyChain.json';

/**
 * Blockchain generic is a class used to serve with some static methods
 * that does some generic call which are used often in different parts
 * of the application.
 */
class BlockchainGeneric {

    // tslint:disable-next-line member-ordering
    public static async onLoad(): Promise<IBlockchainState> {
        // load web3 and the usar accoun
        const web3 = await getWeb3();
        const accounts = await (web3 as any).eth.getAccounts();
        // update component state
        return ({
            userAccount: accounts[0],
            web3,
        });
    }

    /**
     * load supply chain contracts
     */
    public static loadSupplyChain(web3: any): Promise<{ supplyChain: ISupplyChain }> {
        return new Promise(async (resolve, reject) => {
            // load contract
            const ContractSupplyChain = truffleContract(SupplyChainJSON) as ISupplyChain;
            (ContractSupplyChain as any).setProvider((web3 as any).currentProvider);
            const instanceSupplyChain = await ContractSupplyChain.deployed();
            resolve({ supplyChain: instanceSupplyChain });
        });
    }

    /**
     * load rbac contracts
     */
    public static loadRBAC(web3: any): Promise<{ rbac: IRBAC }> {
        return new Promise(async (resolve, reject) => {
            // load contract
            const ContractRBAC = truffleContract(RBACJSON) as IRBAC;
            (ContractRBAC as any).setProvider((web3 as any).currentProvider);
            const instanceRBAC = await ContractRBAC.deployed();
            resolve({ rbac: instanceRBAC });
        });
    }
}

export default BlockchainGeneric;
