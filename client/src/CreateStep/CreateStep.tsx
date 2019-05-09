import React, { Component } from 'react';
import { Sankey } from 'react-vis';
import Energy from './energy.json';

import '../main.scss';
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
            activeLink: null as any,
            item: 'default',
            precedents: 'default',
        };
    }

    public handleChange = (event: any) => {
        if (event.target.name === DOMNames.action) {
            this.setState({ action: event.target.value });
        } else if (event.target.name === DOMNames.precedents) {
            this.setState({ precedents: event.target.value });
        } else if (event.target.name === DOMNames.item) {
            this.setState({ item: event.target.value });
        }
    }

    public handleSubmit = (event: any) => {
        const { precedents } = this.state;
        alert('A name was submitted: ' + precedents);
        event.preventDefault();
    }

    public drawGraph() {
        const nodes = Energy.nodes;
        const links = Energy.links;
        const { activeLink } = this.state;
        const mapLinks = links.map((d, i) => ({
            ...d,
            opacity:
                activeLink && i === (activeLink as any).index
                    ? FOCUSED_LINK_OPACITY
                    : BLURRED_LINK_OPACITY,
        }));
        const sankeyStyle = {
            labels: {
                fontSize: '8px',
            },
            links: {
                opacity: 0.3,
            },
            rects: {
                stroke: '#1A3177',
                strokeWidth: 2,
            },
        };

        return (
            <Sankey
                nodes={nodes}
                links={mapLinks}
                width={960}
                height={500}
                layout={24}
                nodeWidth={15}
                nodePadding={10}
                style={sankeyStyle}
                // do not use voronoi in combination with link mouse over
                hasVoronoi={false}
                // tslint:disable-next-line:jsx-no-lambda
                onLinkMouseOver={(node: any) => this.setState({ activeLink: node })}
                // tslint:disable-next-line:jsx-no-lambda
                onLinkMouseOut={() => this.setState({ activeLink: null as any })}
            />
        );
    }

    public render() {
        const { action, precedents, item } = this.state;
        return (
            <main>
                <form onSubmit={this.handleSubmit}>
                    <select name={DOMNames.action} value={action} onChange={this.handleChange}>
                        <option value="default" disabled={true}>Action</option>
                    </select>
                    <select name={DOMNames.precedents} value={precedents} onChange={this.handleChange}>
                        <option value="default" disabled={true}>Precedents</option>
                    </select>
                    <select name={DOMNames.item} value={item} onChange={this.handleChange}>
                        <option value="default" disabled={true}>Item</option>
                    </select>
                    <input type="submit" />
                </form>
                {this.drawGraph()}
            </main>
        );
    }
}

export default CreateStep;
