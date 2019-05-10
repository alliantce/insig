import React, { Component } from 'react';
import { Connect } from 'uport-connect';

import { createLogger, format, transports } from 'winston';
import '../main.scss';
import Fiat500 from './fiat-500.png';
import './auth.scss';

import Navbar from '../Components/Navbar/Navbar';

/**
 * Connect to uport
 */
const uport = new Connect('Soup', {
    bannerImage: { '/': '/ipfs/QmSu1BvnPGy5gEEe2eHunyNN6vb2Zd4pvaqABbvVHUKP3T' },
    description: 'Some potatos are better than others.',
    network: 'ropsten',
});

/**
 * Setting up a logger.
 */
const logger = createLogger({
    format: format.combine(
        format.timestamp(),
        format.json(),
    ),
    level: 'debug',
    transports: [
        new transports.Console(),
    ],
});
/**
 * Define class interface
 */
interface IAuthState {
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
    }

    /**
     * @ignore
     */
    public componentDidMount() {
        //
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
        uport.onResponse('disclosureReq').then((response: any) => {
            console.log(response);
            const json = JSON.stringify(response.payload);
            console.log(json);

            uport.sendVerification({
                claim: { Example: { 'Last Seen': 'now' } },
                exp: Math.floor(new Date().getTime() / 1000) + 1 * 60,
            });
        });

    }

    public handleVerify = () => {
        uport.loadState();
        console.log(uport.state);
    }

    /**
     * @ignore
     */
    public render() {
        return (
            <div>
                <Navbar />
                <main>
                    <img src={Fiat500} />
                    <button onClick={this.handleLogin}>
                        Login
                    </button>
                    <button onClick={this.handleLogout}>
                        Logout
                    </button>
                    <button onClick={this.handleVerify}>
                        Verify
                    </button>
                </main>
            </div>
        );
    }
}

export default Auth;
