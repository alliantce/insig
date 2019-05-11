import React, { Component } from 'react';
import { Connect } from 'uport-connect';

import '../../main.scss';
import Fiat500 from './fiat-500.png';
import './navbar.scss';
import PortugueseFlag from './portugal.png';

/**
 * Connect to uport
 */
const uport = new Connect('Soup', {
    bannerImage: { '/': '/ipfs/QmSu1BvnPGy5gEEe2eHunyNN6vb2Zd4pvaqABbvVHUKP3T' },
    description: 'Some potatos are better than others.',
    network: 'ropsten',
});
/**
 * Action class
 */
class Navbar extends Component<{}, {}> {
    /**
     * @ignore
     */
    constructor(props: any) {
        super(props);
    }

    /**
     * @ignore
     */
    public render() {
        return (
            <nav className="navbar is-light" role="navigation" aria-label="main navigation">
                {/* add a loggo on the left side */}
                <div className="navbar-brand">
                    <a className="navbar-item" href="/">
                        <img src={Fiat500} height="35" />
                    </a>
                </div>

                <div id="navbarBasicExample" className="navbar-menu">
                    {/* add some menu on left side after the logo */}
                    <div className="navbar-start">
                        <a className="navbar-item">Home</a>
                    </div>
                    {/* add welcome or login on right side */}
                    <div className="navbar-end">
                    <div className="navbar-item">
                            <div className="buttons">
                                <img src={PortugueseFlag} />
                            </div>
                        </div>
                        <div className="navbar-item">
                            <div className="buttons">
                                {this.printUser()}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    /**
     * Render either a wecome message or a login button
     */
    private printUser() {
        // load uport status from browser
        uport.loadState();
        const username = uport.state.name;
        // if the user is logged, say hello!
        if (username !== undefined) {
            return <div>Welcome {username}</div>;
        } else {
            // otherwise, leave a link to auth page
            return <a className="button is-light" href="/auth">Log in</a>;
        }
    }
}

export default Navbar;
