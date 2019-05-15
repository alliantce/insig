import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import { Sankey } from 'react-vis';
import Energy from './energy.json';

import BlockchainGeneric from '../Common/BlockchainGeneric';
import { IBlockchainState, ISupplyChain } from '../Common/CommonInterfaces';
import '../main.scss';
import './addstate.scss';

import Navbar from '../Components/Navbar/Navbar';

// graphic variables
const BLURRED_LINK_OPACITY = 0.3;
const FOCUSED_LINK_OPACITY = 1;
// dom controller names
enum DOMNames {
    infoStateForm = 'infoStateForm',
    infoStateAction = 'infoStateAction',
    infoStatePrecedents = 'infoStatePrecedents',
    infoStateItem = 'infoStateItem',
    rootStateForm = 'rootStateForm',
    rootStateAction = 'rootStateAction',
    rootStateOperatorRole = 'rootStateOperatorRole',
    rootStateOwnerRole = 'rootStateOwnerRole',
}
interface IAddState extends IBlockchainState {
    infoStateAction: string;
    infoStatePrecedents: string;
    infoStateItem: string;
    activeLink: object;
    listActions: string[];
    supplyChain: ISupplyChain;
    currentTab: string;
    rootStateAction: string;
    rootStateOperatorRole: string;
    rootStateOwnerRole: string;
}
class AddState extends Component<{}, IAddState> {
    constructor(props: any) {
        super(props);
        this.state = {
            activeLink: null as any,
            currentTab: '',
            infoStateAction: 'default',
            infoStateItem: 'default',
            infoStatePrecedents: 'default',
            listActions: [],
            rootStateAction: 'default',
            rootStateOperatorRole: 'default',
            rootStateOwnerRole: 'default',
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
                this.loadActions().then((actionsName) => this.setState({ listActions: actionsName }));
            });
        });
    }

    public handleChange = (event: any) => {
        if (event.target.name === DOMNames.infoStateAction) {
            this.setState({ infoStateAction: event.target.value });
        } else if (event.target.name === DOMNames.infoStatePrecedents) {
            this.setState({ infoStatePrecedents: event.target.value });
        } else if (event.target.name === DOMNames.infoStateItem) {
            this.setState({ infoStateItem: event.target.value });
        }
    }

    public handleSubmit = (event: any) => {
        const { infoStatePrecedents } = this.state;
        alert('A name was submitted: ' + infoStatePrecedents);
        event.preventDefault();
    }

    public handleChangeTab = (event: any) => {
        this.setState({ currentTab: event.currentTarget.dataset.id });
        event.preventDefault();
    }

    public render() {
        return (
            <div>
                <Navbar />
                <aside className="menu">
                    <p className="menu-label">
                        General
                    </p>
                    <ul className="menu-list">
                        <li data-id={DOMNames.rootStateForm} onClick={this.handleChangeTab}><a>Add root state</a></li>
                        <li data-id={DOMNames.infoStateForm} onClick={this.handleChangeTab}><a>Add state</a></li>
                    </ul>
                </aside>
                <main>
                    {this.renderTabContent()}
                </main>
            </div>
        );
    }

    private renderTabContent = () => {
        const {
            infoStateAction,
            infoStatePrecedents,
            infoStateItem,
            listActions,
            currentTab,
            rootStateAction,
            rootStateOperatorRole,
            rootStateOwnerRole,
        } = this.state;

        return (
            <div>
                <div hidden={currentTab !== DOMNames.rootStateForm}>
                    <form name={DOMNames.rootStateForm} onSubmit={this.handleSubmit}>
                        <legend>Add root state</legend>
                        <select name={DOMNames.rootStateAction} value={rootStateAction} onChange={this.handleChange}>
                            <option value="default" disabled={true}>Action</option>
                            {listActions.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <select
                            name={DOMNames.rootStateOperatorRole}
                            value={rootStateOperatorRole}
                            onChange={this.handleChange}
                        >
                            <option value="default" disabled={true}>Operator Role</option>
                        </select>
                        <select
                            name={DOMNames.rootStateOwnerRole}
                            value={rootStateOwnerRole}
                            onChange={this.handleChange}
                        >
                            <option value="default" disabled={true}>Owner Role</option>
                        </select>
                        <input type="submit" />
                    </form>
                </div>
                <div hidden={currentTab !== DOMNames.infoStateForm}>
                    <form name={DOMNames.infoStateForm} onSubmit={this.handleSubmit}>
                        <legend>Add state</legend>
                        <select name={DOMNames.infoStateAction} value={infoStateAction} onChange={this.handleChange}>
                            <option value="default" disabled={true}>Action</option>
                            {listActions.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <select
                            name={DOMNames.infoStatePrecedents}
                            value={infoStatePrecedents}
                            onChange={this.handleChange}
                        >
                            <option value="default" disabled={true}>Precedents</option>
                        </select>
                        <select name={DOMNames.infoStateItem} value={infoStateItem} onChange={this.handleChange}>
                            <option value="default" disabled={true}>Item</option>
                        </select>
                        <input type="submit" />
                    </form>
                </div>
                {this.drawGraph()}
            </div>
        );
    }

    private drawGraph() {
        const nodes = Energy.nodes;
        const links = Energy.links;
        const { activeLink } = this.state;
        const mapLinks = links.map((d, i) => ({
            ...d,
            opacity:
                activeLink && i === (activeLink as any).index
                    ? FOCUSED_LINK_OPACITY
                    : BLURRED_LINK_OPACITY,
        }));
        const sankeyStyle = {
            labels: {
                fontSize: '8px',
            },
            links: {
                opacity: 0.3,
            },
            rects: {
                stroke: '#1A3177',
                strokeWidth: 2,
            },
        };

        return (
            <Sankey
                nodes={nodes}
                links={mapLinks}
                width={960}
                height={500}
                layout={24}
                nodeWidth={15}
                nodePadding={10}
                style={sankeyStyle}
                // do not use voronoi in combination with link mouse over
                hasVoronoi={false}
                // tslint:disable-next-line:jsx-no-lambda
                onLinkMouseOver={(node: any) => this.setState({ activeLink: node })}
                // tslint:disable-next-line:jsx-no-lambda
                onLinkMouseOut={() => this.setState({ activeLink: null as any })}
            />
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

export default AddState;
