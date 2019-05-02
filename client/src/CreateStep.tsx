import React, { Component } from 'react';
import { Sankey } from 'react-vis';
import Energy from './energy.json';

import './main.scss';
import './createstep.scss';


const BLURRED_LINK_OPACITY = 0.3;
const FOCUSED_LINK_OPACITY = 1;
enum DOMNames {
    action = 'action',
    precedents = 'precedents',
    item = 'item',
}
interface ICreateStep {
    action: string;
    precedents: string;
    item: string;
    activeLink: object;
}
class CreateStep extends Component<{}, ICreateStep> {
    constructor(props: any) {
        super(props);
        this.state = {
            action: 'default',
            precedents: 'default',
            item: 'default',
            activeLink: null as any,
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
        const nodes = Energy.nodes;
        const links = Energy.links;
        const { activeLink } = this.state;

        return (
            <Sankey
                nodes={nodes}
                links={links.map((d, i) => ({
                    ...d,
                    opacity:
                        activeLink && i === (activeLink as any).index
                            ? FOCUSED_LINK_OPACITY
                            : BLURRED_LINK_OPACITY
                }))}
                width={960}
                height={500}
                layout={24}
                nodeWidth={15}
                nodePadding={10}
                style={{
                    links: {
                        opacity: 0.3
                    },
                    labels: {
                        fontSize: '8px'
                    },
                    rects: {
                        strokeWidth: 2,
                        stroke: '#1A3177'
                    }
                }}
                // do not use voronoi in combination with link mouse over
                hasVoronoi={false}
                onLinkMouseOver={(node: any) => this.setState({ activeLink: node })}
                onLinkMouseOut={() => this.setState({ activeLink: null as any })}
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
