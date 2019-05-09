import React, { Component } from 'react';

import '../main.scss';
import './action.scss';

interface IActionState {
    action: string;
    listActions: string [];
}
class Action extends Component<{}, IActionState> {
    constructor(props: any) {
        super(props);
        this.state = {
            action: '',
            listActions: [],
        };
    }

    public componentDidMount() {
        this.loadActions();
    }

    public handleChange = (event: any) => {
        this.setState({ action: event.target.value });
    }

    public handleSubmit = (event: any) => {
        const { action } = this.state;
        alert('hi, value ' + action);
        event.preventDefault();
    }

    public loadActions() {
        const someRandomValues = ['Unordered list item 1', 'Unordered list item 2'];
        this.setState({listActions: someRandomValues});
    }

    public render() {
        const { action, listActions } = this.state;
        return (
            <main>
                <form onSubmit={this.handleSubmit}>
                    <input
                        type="text"
                        name="action"
                        value={action}
                        onChange={this.handleChange}
                        placeholder="Action message"
                    />
                    <input type="submit" />
                </form>
                <ul>
                    {listActions.map((e) => <li key={e}>{e}</li>)}
                </ul>
            </main>
        );
    }
}

export default Action;
