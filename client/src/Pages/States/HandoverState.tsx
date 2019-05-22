import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import { ISupplyChain } from '../../Common/CommonInterfaces';


// dom controller names
enum DOMNames {
    // handover
    handoverStateForm = 'handoverStateForm',
    handoverStateAction = 'handoverStateAction',
    handoverStateAsset = 'handoverStateAsset',
    handoverStateOperatorRole = 'handoverStateOperatorRole',
    handoverStateOwnerRole = 'handoverStateOwnerRole',
}
// Component state
interface IHandoverState {
    handoverStateAction: string;
    handoverStateAsset: string;
    handoverStateOperatorRole: string;
    handoverStateOwnerRole: string;
}
// Component props
interface IHandoverProps {
    userAccount: string;
    supplyChain: ISupplyChain;
    listActions: Array<{ description: string, index: number }>;
    rolesList: Array<{ description: string, index: number }>;
}
class HandoverState extends Component<IHandoverProps, IHandoverState> {
    /**
     * @ignore
     */
    constructor(props: any) {
        super(props);
        this.state = {
            handoverStateAction: 'default',
            handoverStateAsset: '',
            handoverStateOperatorRole: 'default',
            handoverStateOwnerRole: 'default',
        };
    }

    /**
     * @ignore
     */
    public componentDidMount() {
        //
    }

    /**
     * Handle all changes in inputs, selects
     */
    public handleChange = (event: any) => {
        if (event.target.name === DOMNames.handoverStateAction) {
            this.setState({ handoverStateAction: event.target.value });
        } else if (event.target.name === DOMNames.handoverStateAsset) {
            this.setState({ handoverStateAsset: event.target.value });
        } else if (event.target.name === DOMNames.handoverStateOperatorRole) {
            this.setState({ handoverStateOperatorRole: event.target.value });
        } else if (event.target.name === DOMNames.handoverStateOwnerRole) {
            this.setState({ handoverStateOwnerRole: event.target.value });
        }
    }

    /**
     * Handle any submit button
     */
    public handleSubmit = (event: any) => {
        const { supplyChain, userAccount } = this.props;
        const {
            handoverStateAction,
            handoverStateAsset,
            handoverStateOperatorRole,
            handoverStateOwnerRole,
        } = this.state;
        supplyChain.addHandoverState(
            new BigNumber(handoverStateAction),
            new BigNumber(handoverStateAsset),
            new BigNumber(handoverStateOperatorRole),
            new BigNumber(handoverStateOwnerRole),
            { from: userAccount },
        ).then(() => {
            alert('Success!');
        });
        event.preventDefault();
    }

    /**
     * @ignore
     */
    public render() {
        const { listActions, rolesList } = this.props;
        const {
            handoverStateAction,
            handoverStateAsset,
            handoverStateOperatorRole,
            handoverStateOwnerRole,
        } = this.state;
        return (
            <form name={DOMNames.handoverStateForm} onSubmit={this.handleSubmit}>
                <legend>Handover state</legend>
                <div className="select">
                    <select
                        name={DOMNames.handoverStateAction}
                        value={handoverStateAction}
                        onChange={this.handleChange}
                    >
                        <option value="default" disabled={true}>Action</option>
                        {listActions.map((a) => <option key={a.index} value={a.index}>{a.description}</option>)}
                    </select>
                </div>
                <br />
                <input
                    className="input"
                    type="text"
                    placeholder="Asset"
                    name={DOMNames.handoverStateAsset}
                    value={handoverStateAsset}
                    onChange={this.handleChange}
                />
                <br />
                <div className="select">
                    <select
                        name={DOMNames.handoverStateOperatorRole}
                        value={handoverStateOperatorRole}
                        onChange={this.handleChange}
                    >
                        <option value="default" disabled={true}>Operator Role</option>
                        {rolesList.map((r) => <option key={r.index} value={r.index}>{r.description}</option>)}
                    </select>
                </div>
                <br />
                <div className="select">
                    <select
                        name={DOMNames.handoverStateOwnerRole}
                        value={handoverStateOwnerRole}
                        onChange={this.handleChange}
                    >
                        <option value="default" disabled={true}>Owner Role</option>
                        {rolesList.map((r) => <option key={r.index} value={r.index}>{r.description}</option>)}
                    </select>
                </div>
                <br />
                <input className="button is-primary" type="submit" />
            </form>
        );
    }
}

export default HandoverState;
