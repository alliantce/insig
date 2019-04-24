import React, { Component } from 'react';

import './main.scss';
import './action.scss';

class Action extends Component {
    render() {
        return (
            <main>
                <form>
                    <input type="text" name="action" />
                    <input type="submit" />
                </form>
                <ul>
                    <li>Unordered list item 1</li>
                    <li>Unordered list item 2</li>
                </ul>
            </main>
        );
    }
}

export default Action;
