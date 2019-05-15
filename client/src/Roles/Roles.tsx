import BigNumber from 'bignumber.js';
import React, { Component } from 'react';

import '../main.scss';
import './roles.scss';

import Navbar from '../Components/Navbar/Navbar';

import BlockchainGeneric from '../Common/BlockchainGeneric';
import { IBlockchainState, IRBAC } from '../Common/CommonInterfaces';

enum DOMNames {
    newRoleForm = 'newRoleForm',
    newRoleTitle = 'newRoleTitle',
    newRoleAdmin = 'newRoleAdmin',
    newRootRoleForm = 'newRootRoleForm',
    newRootRoleTile = 'newRootRoleTile',
    addBearerForm = 'addBearerForm',
    addBearerName = 'addBearerName',
    removeBearerForm = 'removeBearerForm',
    removeBearerName = 'removeBearerName',
    bearerRole = 'bearerRole',
}
/**
 * Roles class states
 */
interface IRolesState extends IBlockchainState {
    rbac: IRBAC;
    rootRoleTile: string;
    roleTitle: string;
    roleAdmin: string;
    rolesList: Array<{ description: string, index: number }>;
    addBearerName: string;
    removeBearerName: string;
    bearerRole: string;
    currentTab: string;
}
/**
 * Roles class
 */
class Roles extends Component<{}, IRolesState> {
    constructor(props: any) {
        super(props);
        this.state = {
            addBearerName: '',
            currentTab: '',
            bearerRole: 'default',
            rbac: undefined as any,
            removeBearerName: '',
            roleAdmin: '',
            roleTitle: '',
            rolesList: [],
            rootRoleTile: '',
            userAccount: '',
            web3: undefined as any,
        };
    }

    /**
     * @ignore
     */
    public componentDidMount() {
        BlockchainGeneric.onLoad().then((generic) => {
            BlockchainGeneric.loadRBAC(generic.web3).then(async (contracts) => {
                this.setState({
                    rbac: contracts.rbac,
                    userAccount: generic.userAccount,
                    web3: generic.web3,
                }, this.loadRoles);
            });
        });
    }

    public handleChange = (event: any) => {
        if (event.target.name === DOMNames.newRoleTitle) {
            this.setState({ roleTitle: event.target.value });
        } else if (event.target.name === DOMNames.newRootRoleTile) {
            this.setState({ rootRoleTile: event.target.value });
        } else if (event.target.name === DOMNames.addBearerName) {
            this.setState({ addBearerName: event.target.value });
        } else if (event.target.name === DOMNames.removeBearerName) {
            this.setState({ removeBearerName: event.target.value });
        } else if (event.target.name === DOMNames.bearerRole) {
            this.setState({ bearerRole: event.target.value });
        }
    }

    public handleSubmit = (event: any) => {
        const { rbac } = this.state;
        const formName = event.target.name;
        if (formName === DOMNames.newRoleForm) {
            const { roleAdmin, roleTitle } = this.state;
            rbac.addRole(roleTitle, new BigNumber(roleAdmin)).then(() => {
                // refresh page
            });
        } else if (formName === DOMNames.newRootRoleForm) {
            const { rootRoleTile } = this.state;
            rbac.addRootRole(rootRoleTile).then(() => {
                // refresh page
            });
        } else if (formName === DOMNames.addBearerForm) {
            const { addBearerName, bearerRole } = this.state;
            rbac.addBearer(addBearerName, new BigNumber(bearerRole));
        } else if (formName === DOMNames.removeBearerForm) {
            const { removeBearerName, bearerRole } = this.state;
            rbac.removeBearer(removeBearerName, new BigNumber(bearerRole));
        }
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
                        <li data-id={DOMNames.newRootRoleForm} onClick={this.handleChangeTab}><a>Add root role</a></li>
                        <li data-id={DOMNames.newRoleForm} onClick={this.handleChangeTab}><a>Add role</a></li>
                        <li data-id={DOMNames.addBearerForm} onClick={this.handleChangeTab}><a>Add Bearer</a></li>
                        <li data-id={DOMNames.removeBearerForm} onClick={this.handleChangeTab}><a>Remove Bearer</a></li>
                        <li data-id="existingRoles" onClick={this.handleChangeTab}><a>Existing roles</a></li>
                    </ul>
                </aside>
                <main>
                    {this.renderTabContent()}
                </main>
            </div>
        );
    }

    private renderTabContent() {
        const {
            currentTab, rootRoleTile, roleAdmin, roleTitle, addBearerName, rolesList, bearerRole, removeBearerName,
        } = this.state;
        return (<div>
            <div hidden={currentTab !== DOMNames.newRootRoleForm}>
                Add root role
                <form name={DOMNames.newRootRoleForm} onSubmit={this.handleSubmit}>
                    <input
                        className="input"
                        type="text"
                        placeholder="Root role tile"
                        name={DOMNames.newRootRoleTile}
                        value={rootRoleTile}
                        onChange={this.handleChange}
                    />
                    <br />
                    <input type="submit" className="button is-primary" />
                </form>
            </div>
            <div hidden={currentTab !== DOMNames.newRoleForm}>
                Add role
                <form name={DOMNames.newRoleForm} onSubmit={this.handleSubmit}>
                    <input
                        className="input"
                        type="text"
                        placeholder="Role name"
                        name={DOMNames.newRoleTitle}
                        value={roleTitle}
                        onChange={this.handleChange}
                    />
                    <br />
                    <input
                        className="input"
                        type="text"
                        placeholder="Admin role"
                        name={DOMNames.newRoleAdmin}
                        value={roleAdmin}
                        onChange={this.handleChange}
                    />
                    <br />
                    <input type="submit" className="button is-primary" />
                </form>
            </div>
            <div hidden={currentTab !== DOMNames.addBearerForm}>
                Add Bearer
                    <form name={DOMNames.addBearerForm} onSubmit={this.handleSubmit}>
                    <input
                        className="input"
                        type="text"
                        placeholder="Bearer name"
                        name={DOMNames.addBearerName}
                        value={addBearerName}
                        onChange={this.handleChange}
                    />
                    <br />
                    <select name={DOMNames.bearerRole} value={bearerRole} onChange={this.handleChange}>
                        <option key="default" value="default" disabled={true}>Role</option>
                        {rolesList.map((r) => <option key={r.index} value={r.index}>{r.description}</option>)}
                    </select>
                    <br />
                    <input type="submit" className="button is-primary" />
                </form>
            </div>
            <div hidden={currentTab !== DOMNames.removeBearerForm}>
                Remove Bearer
                    <form name={DOMNames.removeBearerForm} onSubmit={this.handleSubmit}>
                    <input
                        className="input"
                        type="text"
                        placeholder="Bearer name"
                        name={DOMNames.removeBearerName}
                        value={removeBearerName}
                        onChange={this.handleChange}
                    />
                    <br />
                    <input type="submit" className="button is-primary" />
                </form>
            </div>
            <div>
                Existing roles
                    <ol type="i">
                    {rolesList.map((r) => <li key={r.index}>{r.description} -> Index: {r.index}</li>)}
                </ol>
            </div>
        </div>);
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
        for (let r = 0; r < totalRoles.toNumber(); r += 1) {
            roles.push({ description: (await rbac.roles(new BigNumber(r))).description, index: r });
        }
        this.setState({ rolesList: roles });
    }
}
export default Roles;
