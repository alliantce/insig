import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import { ISupplyChain } from '../../Common/CommonInterfaces';


// dom controller names
enum DOMNames {
    // root
    rootStateForm = 'rootStateForm',
    rootStateAction = 'rootStateAction',
    rootStateOperatorRole = 'rootStateOperatorRole',
    rootStateOwnerRole = 'rootStateOwnerRole',
}
// Component state
interface IRootState {
    rootStateAction: string;
    rootStateOperatorRole: string;
    rootStateOwnerRole: string;
}
// Component props
interface IRootProps {
    userAccount: string;
    supplyChain: ISupplyChain;
    listActions: Array<{ description: string, index: number }>;
    rolesList: Array<{ description: string, index: number }>;
}
class RootState extends Component<IRootProps, IRootState> {
    /**
     * @ignore
     */
    constructor(props: any) {
        super(props);
        this.state = {
            rootStateAction: 'default',
            rootStateOperatorRole: 'default',
            rootStateOwnerRole: 'default',
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
        if (event.target.name === DOMNames.rootStateAction) {
            this.setState({ rootStateAction: event.target.value });
        } else if (event.target.name === DOMNames.rootStateOperatorRole) {
            this.setState({ rootStateOperatorRole: event.target.value });
        } else if (event.target.name === DOMNames.rootStateOwnerRole) {
            this.setState({ rootStateOwnerRole: event.target.value });
        }
    }

    /**
     * Handle any submit button
     */
    public handleSubmit = (event: any) => {
        const { supplyChain, userAccount } = this.props;
        const {
            rootStateAction,
            rootStateOperatorRole,
            rootStateOwnerRole,
        } = this.state;
        supplyChain.addRootState(
            new BigNumber(rootStateAction),
            new BigNumber(rootStateOperatorRole),
            new BigNumber(rootStateOwnerRole),
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
            rootStateAction,
            rootStateOperatorRole,
            rootStateOwnerRole,
        } = this.state;
        return (
            <form name={DOMNames.rootStateForm} onSubmit={this.handleSubmit}>
                <legend>Add root state</legend>
                <div className="select">
                    <select
                        name={DOMNames.rootStateAction}
                        value={rootStateAction}
                        onChange={this.handleChange}
                    >
                        <option value="default" disabled={true}>Action</option>
                        {listActions.map((a) => <option key={a.index} value={a.index}>{a.description}</option>)}
                    </select>
                </div>
                <br />
                <div className="select">
                    <select
                        name={DOMNames.rootStateOperatorRole}
                        value={rootStateOperatorRole}
                        onChange={this.handleChange}
                    >
                        <option value="default" disabled={true}>Operator Role</option>
                        {rolesList.map((r) => <option key={r.index} value={r.index}>{r.description}</option>)}
                    </select>
                </div>
                <br />
                <div className="select">
                    <select
                        name={DOMNames.rootStateOwnerRole}
                        value={rootStateOwnerRole}
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

export default RootState;
