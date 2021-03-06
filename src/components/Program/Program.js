import React from 'react';
import {Select, Spin, Table, Button, Radio, Tooltip} from 'antd';
import Parse from "parse";
import {AuthUserContext} from "../Session";
import Form from "antd/lib/form/Form";
import withProgram from './withProgram';
import ProgramContext from './context';
import { ContactlessOutlined } from '@material-ui/icons';
import {NavLink} from "react-router-dom";
import ReactImageZoom from 'react-image-zoom';

var moment = require('moment');
var timezone = require('moment-timezone');

function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
}
class Program extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sessions: [], 
            loading: true,
            gotTracks: false,
            gotRooms: false,
            gotItems: false,
            gotSessions: false,
            timeZone: timezone.tz.guess(),
        }

        console.log('[Program]: downloaded? ' + this.props.downloaded);

        // Call to download program
        if (!this.props.downloaded) 
            this.props.onDown(this.props);
        else{
            this.state.sessions = this.props.sessions;
            this.state.loading = false;
        }
    }

    formatSessionsIntoTable(sessions){
        let groupedByDate = groupBy(sessions,
            (item)=>timezone(item.get("startTime")).tz(this.state.timeZone).format("ddd MMM D"));
        let table = [];
        for(const [date, rawSessions] of groupedByDate){
            let row = {};
            let dateHeader = {label: date, rowSpan: 0};
            row.date = dateHeader;
            let timeBands = groupBy(rawSessions,(session)=>
                (<Tooltip mouseEnterDelay={0.5} title={timezone(session.get("startTime")).tz(this.state.timeZone).format("ddd MMM D LT ") +" - "+ timezone(session.get("endTime")).tz(this.state.timeZone).format("LT z")}>
                    {timezone(session.get("startTime")).tz(this.state.timeZone).format("LT")} - {timezone(session.get("endTime")).tz(this.state.timeZone).format("LT")}</Tooltip>))

            for(const [time, sessions ] of timeBands){
                let timeBandHeader = {label: time, rowSpan: 0};
                row.timeBand = timeBandHeader;
                for (let session of sessions) {
                    let sessionHeader = {label: session.get("title"), rowSpan: 0};
                    row.session = sessionHeader;
                    if (session.get("items")) {
                        for (let programItem of session.get("items")) {
                            row.key = programItem.id;
                            row.programItem = programItem.get("title");
                            row.confKey = programItem.get("confKey");
                            table.push(row);
                            row = {};
                            row.session = {};
                            row.timeBand = {};
                            row.date = {};
                            dateHeader.rowSpan++;
                            timeBandHeader.rowSpan++;
                            sessionHeader.rowSpan++;
                        }
                    }
                }
            }
        }
        return table;
    }

    componentDidUpdate(prevProps) {
        console.log("[Program]: Something changed");

        if (this.state.loading) {
            if (this.state.gotTracks && this.state.gotRooms && this.state.gotItems && this.state.gotSessions) {
                console.log('[Program]: Program download complete');
                this.setState({
                    // sessions: groupedByDate,
                    sessions: this.props.sessions,
                    loading: false
                    // tracks: trackOptions
                });
            }
            else {
                console.log('[Program]: Program still downloading...');
                if (prevProps.tracks.length != this.props.tracks.length) {
                    this.setState({gotTracks: true});
                    console.log('[Program]: got tracks');
                }
                if (prevProps.rooms.length != this.props.rooms.length) {
                    this.setState({gotRooms: true})
                    console.log('[Program]: got rooms');
                }
                if (prevProps.items.length != this.props.items.length) {
                    this.setState({gotItems: true})
                    console.log('[Program]: got items');
                }
                if (prevProps.sessions.length != this.props.sessions.length) {
                    this.setState({gotSessions: true})
                    console.log('[Program]: got sessions');
                }
            }
        }
        else {
            console.log('[Program]: Program cached');
            if (prevProps.tracks.length != this.props.tracks.length) {
                this.setState({tracks: this.props.tracks});
                console.log('[Program]: changes in tracks');
            }
            if (prevProps.rooms.length != this.props.rooms.length) {
                this.setState({rooms: this.props.rooms});
                console.log('[Program]: changes in rooms');
            }
            if (prevProps.items.length != this.props.items.length) {
                this.setState({items: this.props.items});
                console.log('[Program]: changes in items');
            }
            if (prevProps.sessions.length != this.props.sessions.length) {
                // let sortedSessions = [...this.props.sessions];
                // sortedSessions.sort((s1, s2) => s1.get("startTime") - s2.get("startTime"));

                this.setState({sessions: this.props.sessions});
                console.log('[Program]: changes in sessions');
            }
        }
    }

    render() {
        if(!this.state.sessions){
            return <Spin></Spin>
        }
        let days = [];
        // for(const [date, program] of this.state.sessions){
        //     days.push(<ProgramDay date={date} program={program} key={date} formatTime={this.state.formatTime} />)
        // }


        let cols = [{
            title: 'Date',
            className:"program-table-date",
            dataIndex: 'date',
            render: (value, row, index) => {
                const obj = {
                    children: value.label,
                    props: {}
                }
                if (value && value.rowSpan)
                    obj.props.rowSpan = value.rowSpan;
                else
                    obj.props.rowSpan = 0;
                return obj;
            },
        },{  title: 'Time',
            dataIndex: 'timeBand',
            className:"program-table-timeBand",
            render: (value, row, index) => {
                const obj = {
                    children: value.label,
                    props: {}
                }
                if (value && value.rowSpan)
                    obj.props.rowSpan = value.rowSpan;
                else
                    obj.props.rowSpan = 0;
                return obj;
            }
        },{  title: 'Session',
            className:"program-table-session",
            dataIndex: 'session',
            render: (value, row, index) => {
                const obj = {
                    children: value.label,
                    props: {}
                }
                if (value && value.rowSpan)
                    obj.props.rowSpan = value.rowSpan;
                else
                    obj.props.rowSpan = 0;
                return obj;
            }
        },
            {
                title: "Content",
                className:"program-table-programItem",
                dataIndex: "programItem",
                render: (value, row, index)=>{
                    return <NavLink to={"/program/"+row.confKey}>{value}</NavLink>
                }
            }
        ];
        const props = {width: 700, zoomWidth: 700,  zoomPosition: "original", img: 'https://2020.icse-conferences.org/getImage/orig/ICSE-Schedule.PNG'};
        return <div>
            <h4>Program Overview:</h4>
            {/* <ReactImageZoom {...props}/> */}
            <img style={{width: "100%", height: "100%"}} src={'https://2020.icse-conferences.org/getImage/orig/ICSE-Schedule.PNG'} /> 

            <h4>Details:</h4>
            <Radio.Group defaultValue="timezone.tz.guess()" onChange={e => {this.setState({timeZone: e.target.value})}}>
                <Radio.Button value="timezone.tz.guess()">Local Time</Radio.Button>
                <Radio.Button value="UTC">UTC Time</Radio.Button>
            </Radio.Group>

            <br />
            <br />

            <div className="programPage">
                <div className="programFilters">
                   {/*<Form>*/}
                   {/*    <Form.Item label={"Track"}>*/}
                   {/*        <Select mode="multiple" placeholder="Filter by track" options={this.state.tracks}/>*/}
                   {/*    </Form.Item>*/}
                   {/*</Form>*/}
                </div>
                <Table columns={cols} pagination={false} dataSource={this.formatSessionsIntoTable(this.state.sessions)} loading={this.state.loading}></Table>
            </div>
        </div>
    }
}
class ProgramDay extends React.Component{
    constructor(props) {
        super(props);
        //organize into time bands
        let timeBands = groupBy(this.props.program,(session)=>(this.props.formatTime(session.get("startTime"))+ " - ") + this.props.formatTime(session.get('endTime')))
        this.state = {
            timeBands : timeBands
        }
    }
    render(){
        let timeBands = [];
        for(const[timeBand, sessions] of this.state.timeBands){
            timeBands.push(<div key={timeBand} className="sessionTimeBandContainer"><div className="timeBand">{timeBand}</div>
            <div className="sessionContainer">{sessions.map(s=><ProgramSession key={s.id} session={s}/>)}</div></div>)
        }
        return <div className="program-programDay" key={this.props.date}>
            <div className="day">{this.props.date}</div>
            <div className="timebands">{timeBands}</div>
        </div>
    }
}

class ProgramSession extends React.Component {
    render() {
        let items = this.props.session.get("items");
        return <div className="programSession" >
            <div className="sessionTitle">{this.props.session.get("title")}</div>
            <div className="sessionContents">
                {items.map(i => <ProgramItem key={i.id} item={i}/>)}
            </div>
        </div>
    }
}

class ProgramItem extends React.Component {
    render() {
        return (
            <div className="programItem" key={this.props.item.id}>
                {this.props.item.get("title")}
            </div>
        );
    }
}
const
    AuthConsumer = (props) => (
        <ProgramContext.Consumer>
            {({rooms, tracks, items, sessions, people, onDownload, downloaded}) => (
                <AuthUserContext.Consumer>
                    {value => (
                        <Program {...props} auth={value} rooms={rooms} tracks={tracks} items={items} sessions={sessions} people={people} onDown={onDownload} downloaded={downloaded}/>
                    )}
                </AuthUserContext.Consumer>
            )}
        </ProgramContext.Consumer>

    );
export default AuthConsumer;

