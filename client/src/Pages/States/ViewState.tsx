import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import { ISupplyChain, ISupplyChainState } from '../../Common/CommonInterfaces';


// dom controller names
enum DOMNames {
    // info
    stateToRead = 'stateToRead',
}
// Component state
interface IViewState {
    stateToRead: string;
    state: ISupplyChainState;
}
// Component props
interface IInfoProps {
    userAccount: string;
    supplyChain: ISupplyChain;
}
class ViewState extends Component<IInfoProps, IViewState> {
    /**
     * @ignore
     */
    constructor(props: any) {
        super(props);
        this.state = {
            state: undefined as any,
            stateToRead: '',
        };
    }

    /**
     * Handle all changes in inputs, selects
     */
    public handleChange = (event: any) => {
        if (event.target.name === DOMNames.stateToRead) {
            this.setState({ stateToRead: event.target.value });
        }
    }

    /**
     * Handle any submit button
     */
    public handleSubmit = (event: any) => {
        const { supplyChain } = this.props;
        const { stateToRead } = this.state;
        supplyChain.states(new BigNumber(stateToRead)).then((stateInfo) => {
            this.setState({ state: stateInfo });
        });
        event.preventDefault();
    }

    /**
     * @ignore
     */
    public render() {
        const {
            stateToRead,
            state,
        } = this.state;
        let stateComp;
        if (state !== undefined) {
            stateComp = (
                <div className="card">
                    <header className="card-header">
                        <p className="card-header-title">
                        State Id {stateToRead}
                        </p>
                        <a href="#" className="card-header-icon" aria-label="more options">
                            <span className="icon">
                                <i className="fas fa-angle-down" aria-hidden="true" />
                            </span>
                        </a>
                    </header>
                    <div className="card-content">
                        <div className="content">
                            <p><b>Action</b> {state.action.toNumber()}</p>
                            <p><b>Asset</b> {state.asset.toNumber()}</p>
                            <p><b>Creator</b> {state.creator}</p>
                            <p><b>Operator Role</b> {state.operatorRole.toNumber()}</p>
                            <p><b>Owner Role</b> {state.ownerRole.toNumber()}</p>
                            <p><b>Parte Of</b> {state.partOf.toNumber()}</p>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <legend>View state</legend>
                    <input
                        className="input"
                        type="text"
                        placeholder="stateid to get info"
                        name={DOMNames.stateToRead}
                        value={stateToRead}
                        onChange={this.handleChange}
                    />
                    <br />
                    <input className="button is-primary" type="submit" />
                </form>
                <br />
                {stateComp}
            </div>
        );
    }
}

export default ViewState;
