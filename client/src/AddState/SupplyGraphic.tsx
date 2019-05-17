import * as d3 from 'd3';
import React, { Component } from 'react';


interface ISupplyGraphicProps {
    width: number;
    height: number;
}
interface ISupplyGraphicState {
    data: any;
}
/**
 * Thanks to https://frontendcharts.com/react-d3-integrate/
 */
class SupplyGraphic extends Component<ISupplyGraphicProps, ISupplyGraphicState> {
    private colours = ['#2176ae', '#57b8ff', '#b66d0d', '#fbb13c', '#fe6847'];

    constructor(props: any) {
        super(props);

        this.state = {
            data: this.getData(),
        };

        this.handleClick = this.handleClick.bind(this)
    }

    public handleClick() {
        this.setState({
            data: this.getData(),
        });
    }

    public render() {
        const { data } = this.state;
        const maxRadius = 40;
        const xScale = d3.scaleLinear().domain([0, 1]).range([0, this.props.width]);
        const yScale = d3.scaleLinear().domain([0, 1]).range([0, this.props.height]);
        const rScale = d3.scaleLinear().domain([0, 1]).range([0, maxRadius]);

        const points = data.map((d: any) => <circle
            key={d.x * d.y}
            cx={xScale(d.x)}
            cy={yScale(d.y)}
            r={rScale(d.r)}
            fill={this.colours[d.colour]}
        />);

        return (
            <div>
                <svg width={this.props.width} height={this.props.height}>{points}</svg>
                <div><button onClick={this.handleClick}>Update</button></div>
            </div>
        );
    }

    private getData() {
        const numItems = 20 + Math.floor(20 * Math.random());
        const data = [];
        for (let i = 0; i < numItems; i++) {
            data.push({
                colour: i % 5,
                r: Math.random(),
                x: Math.random(),
                y: Math.random(),
            });
        }
        return data;
    }
}

export default SupplyGraphic;
