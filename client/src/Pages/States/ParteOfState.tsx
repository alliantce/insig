import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import { ISupplyChain } from '../../Common/CommonInterfaces';


// dom controller names
enum DOMNames {
    // partof
    parteOfStateForm = 'parteOfStateForm',
    parteOfStateAction = 'parteOfStateAction',
    parteOfStateAsset = 'parteOfStateAsset',
    parteOfStateParteOf = 'parteOfStateParteOf',
}
// Component state
interface IParteOfState {
    parteOfStateAction: string;
    parteOfStateAsset: string;
    parteOfStateParteOf: string;
}
// Component props
interface IParteOfProps {
    userAccount: string;
    supplyChain: ISupplyChain;
    listActions: Array<{ description: string, index: number }>;
}
class ParteOf extends Component<IParteOfProps, IParteOfState> {
    /**
     * @ignore
     */
    constructor(props: any) {
        super(props);
        this.state = {
            parteOfStateAction: 'default',
            parteOfStateAsset: '',
            parteOfStateParteOf: '',
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
        if (event.target.name === DOMNames.parteOfStateAction) {
            this.setState({ parteOfStateAction: event.target.value });
        } else if (event.target.name === DOMNames.parteOfStateAsset) {
            this.setState({ parteOfStateAsset: event.target.value });
        } else if (event.target.name === DOMNames.parteOfStateParteOf) {
            this.setState({ parteOfStateParteOf: event.target.value });
        }
    }

    /**
     * Handle any submit button
     */
    public handleSubmit = (event: any) => {
        const { supplyChain, userAccount } = this.props;
        const {
            parteOfStateAction,
            parteOfStateAsset,
            parteOfStateParteOf,
        } = this.state;
        supplyChain.addPartOfState(
            new BigNumber(parteOfStateAction),
            new BigNumber(parteOfStateAsset),
            new BigNumber(parteOfStateParteOf),
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
        const { listActions } = this.props;
        const {
            parteOfStateAction,
            parteOfStateAsset,
            parteOfStateParteOf,
        } = this.state;
        return (
            <form name={DOMNames.parteOfStateForm} onSubmit={this.handleSubmit}>
                <legend>ParteOf state</legend>
                <div className="select">
                    <select
                        name={DOMNames.parteOfStateAction}
                        value={parteOfStateAction}
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
                    name={DOMNames.parteOfStateAsset}
                    value={parteOfStateAsset}
                    onChange={this.handleChange}
                />
                <br />
                <input
                    className="input"
                    type="text"
                    placeholder="Parte of"
                    name={DOMNames.parteOfStateParteOf}
                    value={parteOfStateParteOf}
                    onChange={this.handleChange}
                />
                <br />
                <input className="button is-primary" type="submit" />
            </form>
        );
    }
}

export default ParteOf;
