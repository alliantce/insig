import React, { Component } from 'react';
import { Sankey } from 'react-vis';

import './main.scss';
import './createstep.scss';


enum DOMNames {
    action = 'action',
    precedents = 'precedents',
    item = 'item',
}
interface ICreateStep {
    action: string;
    precedents: string;
    item: string;
}
class CreateStep extends Component<{}, ICreateStep> {
    constructor(props: any) {
        super(props);
        this.state = {
            action: 'default',
            precedents: 'default',
            item: 'default',
        };
    }

    handleChange = (event: any) => {
        if (event.target.name === DOMNames.action) {
            this.setState({ action: event.target.value });
        } else if (event.target.name === DOMNames.precedents) {
            this.setState({ precedents: event.target.value });
        } else if (event.target.name === DOMNames.item) {
            this.setState({ item: event.target.value });
        }
    }

    handleSubmit = (event: any) => {
        const { precedents } = this.state;
        alert('A name was submitted: ' + precedents);
        event.preventDefault();
    }

    drawGraph() {
        const nodes = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
        const links = [
            { source: 0, target: 1, value: 10 },
            { source: 0, target: 2, value: 20 },
            { source: 1, target: 2, value: 20 }
        ];
        return (
            <Sankey
                nodes={nodes}
                links={links}
                width={200}
                height={200}
            />
        );
    }

    render() {
        const { action, precedents, item } = this.state;
        return (
            <main>
                <form onSubmit={this.handleSubmit}>
                    <select name={DOMNames.action} value={action} onChange={this.handleChange}>
                        <option value="default" disabled>Action</option>
                    </select>
                    <select name={DOMNames.precedents} value={precedents} onChange={this.handleChange}>
                        <option value="default" disabled>Precedents</option>
                    </select>
                    <select name={DOMNames.item} value={item} onChange={this.handleChange}>
                        <option value="default" disabled>Item</option>
                    </select>
                    <input type="submit" />
                </form>
                {this.drawGraph()}
            </main>
        );
    }
}

export default CreateStep;
