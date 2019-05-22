import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import { Hint, Sankey } from 'react-vis';
import Energy from './energy.json';

import BlockchainGeneric from '../../Common/BlockchainGeneric';
import { IBlockchainState, IRBAC, ISupplyChain } from '../../Common/CommonInterfaces';
import '../../main.scss';
import './addstate.scss';

import Navbar from '../../Components/Navbar/Navbar';

// graphic variables
const BLURRED_LINK_OPACITY = 0.3;
const FOCUSED_LINK_OPACITY = 1;
// dom controller names
enum DOMNames {
    // root
    rootStateForm = 'rootStateForm',
    rootStateAction = 'rootStateAction',
    rootStateOperatorRole = 'rootStateOperatorRole',
    rootStateOwnerRole = 'rootStateOwnerRole',
    // info
    infoStateForm = 'infoStateForm',
    infoStateAction = 'infoStateAction',
    infoStatePrecedents = 'infoStatePrecedents',
    infoStateAsset = 'infoStateAsset',
    // handover
    handoverStateForm = 'handoverStateForm',
    handoverStateAction = 'handoverStateAction',
    handoverStateAsset = 'handoverStateAsset',
    handoverStateOperatorRole = 'handoverStateOperatorRole',
    handoverStateOwnerRole = 'handoverStateOwnerRole',
    // partof
    parteOfStateForm = 'parteOfStateForm',
    parteOfStateAction = 'parteOfStateAction',
    parteOfStateAsset = 'parteOfStateAsset',
    parteOfStateParteOf = 'parteOfStateParteOf',
}
interface IAddState extends IBlockchainState {
    activeLink: any;
    listActions: Array<{ description: string, index: number }>;
    supplyChain: ISupplyChain;
    currentTab: string;
    rootStateAction: string;
    rootStateOperatorRole: string;
    rootStateOwnerRole: string;
    infoStateAction: string;
    infoStatePrecedents: string;
    infoStateAsset: string;
    handoverStateAction: string;
    handoverStateAsset: string;
    handoverStateOperatorRole: string;
    handoverStateOwnerRole: string;
    parteOfStateAction: string;
    parteOfStateAsset: string;
    parteOfStateParteOf: string;
    rolesList: Array<{ description: string, index: number }>;
    rbac: IRBAC;
    nodes: any[];
    links: any[];
}
class AddState extends Component<{}, IAddState> {
    constructor(props: any) {
        super(props);
        this.state = {
            activeLink: null as any,
            currentTab: '',
            handoverStateAction: 'default',
            handoverStateAsset: '',
            handoverStateOperatorRole: 'default',
            handoverStateOwnerRole: 'default',
            infoStateAction: 'default',
            infoStateAsset: '',
            infoStatePrecedents: '',
            links: [],
            listActions: [],
            nodes: [],
            parteOfStateAction: 'default',
            parteOfStateAsset: '',
            parteOfStateParteOf: '',
            rbac: undefined as any,
            rolesList: [],
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
                this.loadGraphicData();
            });
            BlockchainGeneric.loadRBAC(generic.web3).then(async (contracts) => {
                this.setState({
                    rbac: contracts.rbac,
                }, this.loadRoles);
            });
        });
    }

    /**
     * Handle all changes in inputs, selects
     */
    public handleChange = (event: any) => {
        const { currentTab } = this.state;
        if (currentTab === DOMNames.rootStateForm) {
            if (event.target.name === DOMNames.rootStateAction) {
                this.setState({ rootStateAction: event.target.value });
            } else if (event.target.name === DOMNames.rootStateOperatorRole) {
                this.setState({ rootStateOperatorRole: event.target.value });
            } else if (event.target.name === DOMNames.rootStateOwnerRole) {
                this.setState({ rootStateOwnerRole: event.target.value });
            }
        } else if (currentTab === DOMNames.infoStateForm) {
            if (event.target.name === DOMNames.infoStateAction) {
                this.setState({ infoStateAction: event.target.value });
            } else if (event.target.name === DOMNames.infoStatePrecedents) {
                this.setState({ infoStatePrecedents: event.target.value });
            } else if (event.target.name === DOMNames.infoStateAsset) {
                this.setState({ infoStateAsset: event.target.value });
            }
        } else if (currentTab === DOMNames.handoverStateForm) {
            if (event.target.name === DOMNames.handoverStateAction) {
                this.setState({ handoverStateAction: event.target.value });
            } else if (event.target.name === DOMNames.handoverStateAsset) {
                this.setState({ handoverStateAsset: event.target.value });
            } else if (event.target.name === DOMNames.handoverStateOperatorRole) {
                this.setState({ handoverStateOperatorRole: event.target.value });
            } else if (event.target.name === DOMNames.handoverStateOwnerRole) {
                this.setState({ handoverStateOwnerRole: event.target.value });
            }
        } else if (currentTab === DOMNames.parteOfStateForm) {
            if (event.target.name === DOMNames.parteOfStateAction) {
                this.setState({ parteOfStateAction: event.target.value });
            } else if (event.target.name === DOMNames.parteOfStateAsset) {
                this.setState({ parteOfStateAsset: event.target.value });
            } else if (event.target.name === DOMNames.parteOfStateParteOf) {
                this.setState({ parteOfStateParteOf: event.target.value });
            }
        }
    }

    /**
     * Handle any submit button
     */
    public handleSubmit = (event: any) => {
        const {
            currentTab,
            supplyChain,
            rootStateAction,
            rootStateOperatorRole,
            rootStateOwnerRole,
            infoStateAction,
            infoStateAsset,
            infoStatePrecedents,
            handoverStateAction,
            handoverStateAsset,
            handoverStateOperatorRole,
            handoverStateOwnerRole,
            parteOfStateAction,
            parteOfStateAsset,
            parteOfStateParteOf,
            userAccount,
        } = this.state;
        if (currentTab === DOMNames.rootStateForm) {
            supplyChain.addRootState(
                new BigNumber(rootStateAction),
                new BigNumber(rootStateOperatorRole),
                new BigNumber(rootStateOwnerRole),
                { from: userAccount },
            ).then(() => {
                alert('Success!');
            });
        } else if (currentTab === DOMNames.infoStateForm) {
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
        } else if (currentTab === DOMNames.handoverStateForm) {
            supplyChain.addHandoverState(
                new BigNumber(handoverStateAction),
                new BigNumber(handoverStateAsset),
                new BigNumber(handoverStateOperatorRole),
                new BigNumber(handoverStateOwnerRole),
                { from: userAccount },
            ).then(() => {
                alert('Success!');
            });
        } else if (currentTab === DOMNames.parteOfStateForm) {
            supplyChain.addPartOfState(
                new BigNumber(parteOfStateAction),
                new BigNumber(parteOfStateAsset),
                new BigNumber(parteOfStateParteOf),
                { from: userAccount },
            ).then(() => {
                alert('Success!');
            });
        }
        event.preventDefault();
    }

    /**
     * Handle tab change
     */
    public handleChangeTab = (event: any) => {
        this.setState({ currentTab: event.currentTarget.dataset.id });
        event.preventDefault();
    }

    /**
     * @ignore
     */
    public render() {
        return (
            <div>
                <Navbar />
                <aside className="menu">
                    <p className="menu-label">
                        General
                    </p>
                    <ul className="menu-list">
                        <li data-id={DOMNames.rootStateForm} onClick={this.handleChangeTab}>
                            <a>Add root state</a>
                        </li>
                        <li data-id={DOMNames.infoStateForm} onClick={this.handleChangeTab}>
                            <a>Add state</a>
                        </li>
                        <li data-id={DOMNames.handoverStateForm} onClick={this.handleChangeTab}>
                            <a>Handover state</a>
                        </li>
                        <li data-id={DOMNames.parteOfStateForm} onClick={this.handleChangeTab}>
                            <a>Parte Of state</a>
                        </li>
                    </ul>
                </aside>
                <main>
                    {this.renderTabContent()}
                </main>
            </div>
        );
    }

    /**
     * Render content for each tab
     */
    private renderTabContent = () => {
        const {
            listActions,
            currentTab,
            rootStateAction,
            rootStateOperatorRole,
            rootStateOwnerRole,
            infoStateAction,
            infoStatePrecedents,
            infoStateAsset,
            handoverStateAction,
            handoverStateAsset,
            handoverStateOperatorRole,
            handoverStateOwnerRole,
            parteOfStateAction,
            parteOfStateAsset,
            parteOfStateParteOf,
            rolesList,
        } = this.state;

        return (
            <div>
                <div className="tabContent" hidden={currentTab !== DOMNames.rootStateForm}>
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
                </div>
                <div className="tabContent" hidden={currentTab !== DOMNames.infoStateForm}>
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
                </div>
                <div className="tabContent" hidden={currentTab !== DOMNames.handoverStateForm}>
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
                </div>
                <div className="tabContent" hidden={currentTab !== DOMNames.parteOfStateForm}>
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
                </div>
                {this.drawGraph()}
            </div>
        );
    }

    /**
     * Navigate through the precendentsm until root
     */
    private generateGraphic = async (lastState: BigNumber) => {
        const { supplyChain } = this.state;
        const links: [{ source: number, target: number, value: number }] = [] as any;
        const nodes: [{ name: string }] = [{ name: lastState.toString() }];
        const precedents = await supplyChain.getPrecedents(lastState);
        // tslint:disable-next-line prefer-for-of
        for (let p = 0; p < precedents.length; p += 1) {
            links.push({ source: precedents[p].toNumber() - 1, target: lastState.toNumber() - 1, value: 1 });
            const deep = await this.generateGraphic(precedents[p]);
            deep.links.forEach((d) => links.push(d));
            deep.nodes.forEach((d) => nodes.push(d));
        }
        return { links, nodes };
    }

    /**
     * Load data to render graphic
     */
    private loadGraphicData = () => {
        const { supplyChain } = this.state;
        // get the total assets
        supplyChain.totalAssets().then(async (tAssets) => {
            const links: [{ source: number, target: number, value: number }] = [] as any;
            const nodes: [{ name: string }] = [] as any;
            let highestStateNumber = 0;
            // and then navigate through the precedents of each one
            for (let i = 1; i <= tAssets.toNumber(); i += 1) {
                const lastStateN = await supplyChain.lastStates(new BigNumber(i));
                if (lastStateN.toNumber() > highestStateNumber) {
                    highestStateNumber = lastStateN.toNumber();
                }
                const generated = await this.generateGraphic(lastStateN);
                // and add new values to arrays
                generated.links.forEach((e) => {
                    if (
                        links.find((l) => l.source === e.source && l.target === e.target && l.value === e.value)
                        === undefined
                    ) {
                        links.push(e);
                    }
                });
            }
            for (let x = 0; x < highestStateNumber; x += 1) {
                nodes.push({ name: '' + (x + 1) });
            }
            this.setState({ links, nodes });
        });
    }

    private drawGraph() {
        const { activeLink, nodes, links } = this.state;
        // const nodes = Energy.nodes;
        // const links = Energy.links;
        if (nodes.length === 0 || links.length === 0) {
            return;
        }
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

        const customHigh = 80 + nodes.length * 10;
        return (
            <div>
                <Sankey
                    nodes={nodes}
                    links={mapLinks}
                    width={960}
                    height={customHigh}
                    layout={24}
                    align={'right'}
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
                {activeLink && this.renderHint()}
            </div>
        );
    }

    /**
     * load all existing roles
     */
    private loadRoles = async () => {
        const { rbac } = this.state;
        if (rbac === undefined) {
            return [];
        }
        const totalRoles = await rbac.totalRoles();
        const roles: Array<{ description: string, index: number }> = [];
        for (let r = 1; r <= totalRoles.toNumber(); r += 1) {
            roles.push({ description: (await rbac.roles(new BigNumber(r))).description, index: r });
        }
        this.setState({ rolesList: roles });
    }

    /**
     * Load all existing actions
     */
    private loadActions = async () => {
        const { supplyChain } = this.state;
        const actionsName: Array<{ description: string, index: number }> = [];
        const totalActions = (await supplyChain.totalActions()).toNumber();
        for (let a = 1; a <= totalActions; a += 1) {
            actionsName.push({ index: a, description: await supplyChain.actionDescription(new BigNumber(a)) });
        }
        return actionsName;
    }

    /**
     * Render hint when mouse is hover grafic
     */
    private renderHint() {
        const { activeLink } = this.state;

        // calculate center x,y position of link for positioning of hint
        const x =
            parseInt(activeLink.source.x1 + (activeLink.target.x0 - activeLink.source.x1) / 2, 10);
        const y = activeLink.y0 - (activeLink.y0 - activeLink.y1) / 2;

        const hintValue = {
            [`${activeLink.source.name} ➞ ${
                activeLink.target.name
                }`]: activeLink.value,
        };

        return <Hint x={x} y={y} value={hintValue} />;
    }
}

export default AddState;
