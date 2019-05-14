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
    newRootRoleTile = 'newRootRoleTile',
    addBearerName = 'addBearerName',
    removeBearerName = 'removeBearerName',
}
/**
 * Roles class states
 */
interface IRolesState extends IBlockchainState {
    rbac: IRBAC;
    rootRoleTile: string;
    roleTitle: string;
    rolesList: string[];
    addBearerName: string;
    removeBearerName: string;
}
/**
 * Roles class
 */
class Roles extends Component<{}, IRolesState> {
    constructor(props: any) {
        super(props);
        this.state = {
            addBearerName: '',
            rbac: undefined as any,
            removeBearerName: '',
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
        if (event.target.name === 'addRoleTitle') {
            this.setState({ roleTitle: event.target.value });
        }
    }

    public handleSubmit = (event: any) => {
        const { roleTitle } = this.state;
        alert('A name was submitted: ' + roleTitle);
        event.preventDefault();
    }

    public render() {
        const { roleTitle, rolesList, rootRoleTile, addBearerName, removeBearerName } = this.state;
        return (
            <div>
                <Navbar />
                <main>
                    Add root role
                    <form>
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
                        <input type="submit" className="button is-primary" />
                    </form>
                    Add Bearer
                    <form>
                        <input
                            className="input"
                            type="text"
                            placeholder="Bearer name"
                            name={DOMNames.addBearerName}
                            value={addBearerName}
                            onChange={this.handleChange}
                        />
                        <br />
                        <input type="submit" className="button is-primary" />
                    </form>
                    Remove Bearer
                    <form>
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
                    Existing roles
                    <ol type="i">
                        {rolesList.map((r) => <li key={r}>{r}</li>)}
                    </ol>
                </main>
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
        const roles: string[] = [];
        for (let r = 0; r < totalRoles.toNumber(); r += 1) {
            roles.push((await rbac.roles(new BigNumber(r))).description);
        }
        this.setState({ rolesList: roles });
    }
}
export default Roles;
