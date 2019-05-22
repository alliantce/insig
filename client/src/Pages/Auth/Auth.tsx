import React, { Component } from 'react';
import { UPortButton } from 'rimble-ui';
import { Connect } from 'uport-connect';

import '../../main.scss';
import './auth.scss';
import insigLogo from './insigv1trans.png';

import Navbar from '../../Components/Navbar/Navbar';

/**
 * Connect to uport
 */
const uport = new Connect('Soup', {
    bannerImage: { '/': '/ipfs/QmSu1BvnPGy5gEEe2eHunyNN6vb2Zd4pvaqABbvVHUKP3T' },
    description: 'Some potatos are better than others.',
    network: 'ropsten',
});

/**
 * Define class interface
 */
interface IAuthState {
    logged: boolean;
}
/**
 * Action class
 */
class Auth extends Component<{}, IAuthState> {
    /**
     * @ignore
     */
    constructor(props: any) {
        super(props);
        this.state = {
            logged: undefined as any,
        };
    }

    /**
     * @ignore
     */
    public componentDidMount() {
        uport.loadState();
        this.setState({ logged: (uport.state.name !== undefined) });
    }

    public handleLogout = () => {
        uport.logout();
    }

    public handleLogin = () => {
        // Request credentials to login
        const req = {
            notifications: true,
            requested: ['name', 'country'],
        };
        uport.requestDisclosure(req);
        uport.onResponse('disclosureReq').then(() => {
            uport.sendVerification({
                claim: { User: { Signed: new Date() } },
            });
        });
    }

    /**
     * @ignore
     */
    public render() {
        const { logged } = this.state;
        const centerStyle: any = {
            textAlign: 'center',
        };
        let button;
        if (logged) {
            button = (<button className="button is-primary is-large" onClick={this.handleLogout} hidden={!logged}>
                Logout
            </button>);
        } else {
            button = (<UPortButton.Solid onClick={this.handleLogin}>Connect with uPort</UPortButton.Solid>);
        }
        return (
            <div>
                <Navbar />
                <main style={centerStyle}>
                    <img src={insigLogo} />
                    <br />
                    {button}
                </main>
            </div>
        );
    }
}

export default Auth;
