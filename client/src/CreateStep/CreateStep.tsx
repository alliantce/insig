import React, { Component } from 'react';
import { Sankey } from 'react-vis';
import Energy from './energy.json';

import { createLogger, format, transports } from 'winston';
import BlockchainGeneric from '../Common/BlockchainGeneric';
import { IBlockchainState, ISupplyChain } from '../Common/CommonInterfaces';
import '../main.scss';
import './createstep.scss';

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
// graphic variables
const BLURRED_LINK_OPACITY = 0.3;
const FOCUSED_LINK_OPACITY = 1;
// dom controller names
enum DOMNames {
    action = 'action',
    precedents = 'precedents',
    item = 'item',
}
/**
 * Class status
 */
interface ICreateStepStatus extends IBlockchainState {
    action: string;
    precedents: string;
    item: string;
    activeLink: object;
    listActions: string [];
    supplyChain: ISupplyChain;
}
class CreateStep extends Component<{}, ICreateStepStatus> {
    constructor(props: any) {
        super(props);
        this.state = {
            action: 'default',
            activeLink: null as any,
            item: 'default',
            listActions: [],
            precedents: 'default',
            supplyChain: undefined as any,
            userAccount: undefined as any,
            web3: undefined as any,
        };
    }

    /**
     * @ignore
     */
    public componentDidMount() {
        logger.info('[START] componentDidMount');
        BlockchainGeneric.onLoad().then((generic) => {
            BlockchainGeneric.loadSupplyChain(generic.web3).then((contracts) => {
                this.setState({
                    supplyChain: contracts.supplyChain,
                    userAccount: generic.userAccount,
                    web3: generic.web3,
                });
                this.loadActions().then((actionsName) => this.setState({listActions: actionsName}));
            });
        });
        logger.info('[END] componentDidMount');
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
        const { action, precedents, item, listActions } = this.state;
        return (
            <main>
                <form onSubmit={this.handleSubmit}>
                    <select name={DOMNames.action} value={action} onChange={this.handleChange}>
                        <option value="default" disabled={true}>Action</option>
                        {listActions.map((a) => <option key={a} value={a}>{a}</option>)}
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

    private async loadActions() {
        const { supplyChain } = this.state;
        const actionsName: string[] = [];
        const totalActions = await supplyChain.totalActions();
        for (let a = 1; a <= totalActions; a += 1) {
            actionsName.push(await supplyChain.actionDescription(a));
        }
        return actionsName;
    }
}

export default CreateStep;
