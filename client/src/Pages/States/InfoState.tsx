import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import { ISupplyChain } from '../../Common/CommonInterfaces';


// dom controller names
enum DOMNames {
    // info
    infoStateForm = 'infoStateForm',
    infoStateAction = 'infoStateAction',
    infoStatePrecedents = 'infoStatePrecedents',
    infoStateAsset = 'infoStateAsset',
}
// Component state
interface IInfoState {
    infoStateAction: string;
    infoStatePrecedents: string;
    infoStateAsset: string;
}
// Component props
interface IInfoProps {
    userAccount: string;
    supplyChain: ISupplyChain;
    listActions: Array<{ description: string, index: number }>;
}
class InfoState extends Component<IInfoProps, IInfoState> {
    /**
     * @ignore
     */
    constructor(props: any) {
        super(props);
        this.state = {
            infoStateAction: 'default',
            infoStateAsset: '',
            infoStatePrecedents: '',
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
        if (event.target.name === DOMNames.infoStateAction) {
            this.setState({ infoStateAction: event.target.value });
        } else if (event.target.name === DOMNames.infoStatePrecedents) {
            this.setState({ infoStatePrecedents: event.target.value });
        } else if (event.target.name === DOMNames.infoStateAsset) {
            this.setState({ infoStateAsset: event.target.value });
        }
    }

    /**
     * Handle any submit button
     */
    public handleSubmit = (event: any) => {
        const { supplyChain, userAccount } = this.props;
        const {
            infoStateAction,
            infoStateAsset,
            infoStatePrecedents,
        } = this.state;
        const resultPrecedents: BigNumber[] = [];
        if (infoStatePrecedents.indexOf(',') > -1) {
            const precedents = infoStatePrecedents.split(',');
            if (precedents.length > 1) {
                precedents.forEach((p) => resultPrecedents.push(new BigNumber(p)));
            }
        } else if (infoStatePrecedents.length > 0) {
            resultPrecedents.push(new BigNumber(infoStatePrecedents));
        }
        supplyChain.addInfoState(
            new BigNumber(infoStateAction),
            new BigNumber(infoStateAsset),
            resultPrecedents,
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
            infoStateAction,
            infoStateAsset,
            infoStatePrecedents,
        } = this.state;
        return (
            <form name={DOMNames.infoStateForm} onSubmit={this.handleSubmit}>
                <legend>Add state</legend>
                <div className="select">
                    <select
                        name={DOMNames.infoStateAction}
                        value={infoStateAction}
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
                    placeholder="Precedents"
                    name={DOMNames.infoStatePrecedents}
                    value={infoStatePrecedents}
                    onChange={this.handleChange}
                />
                <br />
                <input
                    className="input"
                    type="text"
                    placeholder="Asset"
                    name={DOMNames.infoStateAsset}
                    value={infoStateAsset}
                    onChange={this.handleChange}
                />
                <br />
                <input className="button is-primary" type="submit" />
            </form>
        );
    }
}

export default InfoState;
