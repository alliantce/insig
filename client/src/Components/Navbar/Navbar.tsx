import React, { Component } from 'react';
import { Connect } from 'uport-connect';

import '../../main.scss';
import insigLogo from './insigv1trans.png';
import './navbar.scss';
import PortugueseFlag from './portugal.png';

interface INavbarState {
    uport: any;
}
/**
 * Action class
 */
class Navbar extends Component<{}, INavbarState> {
    /**
     * @ignore
     */
    constructor(props: any) {
        super(props);
        // Connect to uport
        const uport = new Connect('Soup', {
            bannerImage: { '/': '/ipfs/QmSu1BvnPGy5gEEe2eHunyNN6vb2Zd4pvaqABbvVHUKP3T' },
            description: 'Some potatos are better than others.',
            network: 'ropsten',
        });
        this.state = {
            uport,
        };
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
                        <img src={insigLogo} height="35" />
                    </a>
                </div>

                <div id="navbarBasicExample" className="navbar-menu">
                    {/* add some menu on left side after the logo */}
                    <div className="navbar-start">
                        <a className="navbar-item" href="/">Home</a>
                        <a className="navbar-item" href="/actions">Actions</a>
                        <a className="navbar-item" href="/assets">Assets</a>
                        <a className="navbar-item" href="/states">States</a>
                        <a className="navbar-item" href="/roles">Roles</a>
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
        const { uport } = this.state;
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
