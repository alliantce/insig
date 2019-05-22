import BigNumber from 'bignumber.js';
import React, { Component } from 'react';

import { createLogger, format, transports } from 'winston';
import BlockchainGeneric from '../../Common/BlockchainGeneric';
import { IBlockchainState, ISupplyChain } from '../../Common/CommonInterfaces';
import '../../main.scss';
import './actions.scss';

import Navbar from '../../Components/Navbar/Navbar';

/**
 * Define class interface
 */
interface IActionState extends IBlockchainState {
    action: string;
    listActions: string [];
    supplyChain: ISupplyChain;
}
/**
 * Action class
 */
class Action extends Component<{}, IActionState> {
    /**
     * @ignore
     */
    constructor(props: any) {
        super(props);
        this.state = {
            action: '',
            listActions: [],
            supplyChain: undefined as any,
            userAccount: undefined as any,
            web3: undefined as any,
        };
    }

    /**
     * @ignore
     */
    public componentDidMount() {
        BlockchainGeneric.onLoad().then((generic) => {
            BlockchainGeneric.loadSupplyChain(generic.web3).then((contracts) => {
                this.setState({
                    supplyChain: contracts.supplyChain,
                    userAccount: generic.userAccount,
                    web3: generic.web3,
                });
                this.loadActions().then((actionsName) => this.setState({listActions: actionsName}));
            });
        });
    }

    public handleChange = (event: any) => {
        this.setState({ action: event.target.value });
    }

    public handleSubmit = (event: any) => {
        const { action, supplyChain, userAccount } = this.state;
        supplyChain.addAction(action, { from: userAccount }).then(() => alert('Success!'));
        event.preventDefault();
    }

    /**
     * @ignore
     */
    public render() {
        const { action, listActions } = this.state;
        return (
            <div>
                <Navbar />
                <aside />
                <main>
                    <div className="tabContent">
                        <form onSubmit={this.handleSubmit}>
                            Add action
                            <br />
                            <input
                                className="input"
                                type="text"
                                name="action"
                                value={action}
                                onChange={this.handleChange}
                                placeholder="Action message"
                            />
                            <br />
                            <input className="button is-primary" type="submit" />
                        </form>
                    </div>
                    <ol className="is-lower-roman">
                        {listActions.map((e) => <li key={e}>{e}</li>)}
                    </ol>
                </main>
            </div>
        );
    }

    private async loadActions() {
        const { supplyChain } = this.state;
        const actionsName: string[] = [];
        const totalActions = (await supplyChain.totalActions()).toNumber();
        for (let a = 1; a <= totalActions; a += 1) {
            actionsName.push(await supplyChain.actionDescription(new BigNumber(a)));
        }
        return actionsName;
    }
}

export default Action;
