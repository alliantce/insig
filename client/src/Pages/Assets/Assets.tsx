import React, { Component } from 'react';

import '../../main.scss';

import Navbar from '../../Components/Navbar/Navbar';

/**
 * Assets class
 */
class Assets extends Component<{}, {}> {
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

    /**
     * @ignore
     */
    public render() {
        return (
            <div>
                <Navbar />
                <aside />
                <main />
            </div>
        );
    }
}

export default Assets;
