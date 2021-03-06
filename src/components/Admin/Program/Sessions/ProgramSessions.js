import React, {Fragment} from 'react';
import {Button, DatePicker, Form, Input, Modal, Popconfirm, Select, Space, Spin, Table, Tabs} from "antd";
import Parse from "parse";
import {AuthUserContext} from "../../../Session";
import {ProgramContext} from "../../../Program";
import moment from 'moment';
import * as timezone from 'moment-timezone';
import {DeleteOutlined, EditOutlined} from '@ant-design/icons';

const { Option } = Select;

const {TabPane} = Tabs;
const IconText = ({icon, text}) => (
    <Space>
        {React.createElement(icon)}
        {text}
    </Space>
);

const Livesessionsources = ['', 'YouTube', 'Twitch', 'Facebook', 'iQIYI', 'ZoomUS', 'ZoomCN'];

class ProgramSessions extends React.Component {
    constructor(props) {
        super(props);
        console.log(this.props);
        this.state = {
            loading: true,
            toggle: false,
            sessions: [],
            rooms: [],
            items: [],
            gotSessions: false,
            gotRooms: false,
            gotItems: false,
            editing: false,
            edt_session: undefined,
            searched: false,
            searchResult: ""
        };

        console.log('[Admin/Sessions]: downloaded? ' + this.props.downloaded);

        // Call to download program
        if (!this.props.downloaded)
            this.props.onDown(this.props);
        else {
            this.state.rooms = this.props.rooms;
            this.state.sessions = this.props.sessions;
            this.state.items = this.props.items;
        }
    }


    async onCreate(values) {
        console.log("OnCreate! " + values.title)
        var _this = this;
        let room = this.props.rooms.find(r => r.id == values.room);
        if (!room)
            console.log('Invalid room ' + values.room);

        // Create the session record
        var Session = Parse.Object.extend("ProgramSession");
        var session = new Session();
        session.set('conference', this.props.auth.currentConference);
        session.set("title", values.title);
        session.set("startTime", values.startTime.toDate());
        session.set("endTime", values.endTime.toDate());
        session.set("room", room);
        session.set("items", values.items)
        session.set("confKey", Math.floor(Math.random() * 10000000).toString());

        let acl = new Parse.ACL();
        acl.setPublicWriteAccess(false);
        acl.setPublicReadAccess(true);
        acl.setRoleWriteAccess(this.props.auth.currentConference.id+"-manager", true);
        acl.setRoleWriteAccess(this.props.auth.currentConference.id+"-admin", true);
        session.setACL(acl);
        session.save()
        .then(session => this.setState({visible: false /*, sessions: sortedSessions*/}))
        .catch(err => {
            console.log(err);
            console.log("@" + session.id);
        });

        // let data = {
        //     conference: this.props.auth.currentConference.id,
        //     title: values.title,
        //     startTime: values.startTime.toDate(),
        //     endTime: values.endTime.toDate(),
        //     room: room.id
        // }
        // Parse.Cloud.run("newProgramSession", data).then(() => {
        //     console.log('[ProgramSession]: sent request to create new session ' + data.title);
        // });

    }

    onDelete(value) {
        console.log("Deleting " + value + " " + value.get("title"));
        // Delete the watchers first

        value.destroy().then(() => {
            this.setState({
                sessions: [...this.state.sessions]
            });
        });
    }

    onEdit(session) {
        console.log("Editing " + session.get("title") + " " + session.id + " " + session.get('room').get('name'));
        this.setState({
            visible: true,
            editing: true,
            edt_session: {
                objectId: session.id,
                title: session.get("title"),
                startTime: moment(session.get("startTime")),
                endTime: moment(session.get("endTime")),
                room: session.get("room").get('name'),
                roomId: session.get('room').id,
                items: session.get("items"),
                newItems: undefined
            }
        });
    }

    onUpdate(values) {
        var _this = this;
        console.log("Updating session " + values.title + " in room " + values.room + "--" + values.roomId + "--");
        let session = this.state.sessions.find(s => s.id == values.objectId);

        if (session) {

            if (session.get("title") != values.title)
                session.set("title", values.title);
            if (session.get("startTime") != values.startTime.toDate())
                session.set("startTime", values.startTime.toDate());
            if (session.get("endTime") != values.endTime.toDate())
                session.set("endTime", values.endTime.toDate());
            session.set("items", values.items);
            if (!session.get("room") || (session.get("room")  && values.room != session.get("room").get("name"))) { // room changed
                let room = this.state.rooms.find(r => r.id == values.room);
                if (room) {
                    console.log('--> Set new room ' + room.get("name"));
                    session.set("room", room);
                }
                else
                    console.log("[Admin/Session]: invalid room " + values.room.id)
            }
                
            session.save().then((val) => {
                _this.setState({visible: false, editing: false});
            }).catch(err => {
                console.log(err + ": " + values.objectId);
            })
        }
        else {
            console.log("Program session not found: " + values.title);
        }
    }

    setVisible() {
        this.setState({'visible': !this.state.visible});
    }

    componentDidMount() {

    }

    componentDidUpdate(prevProps) {

        if (this.state.loading) {
            if (this.state.gotRooms && this.state.gotSessions && this.state.gotItems) {
                console.log('[Admin/Sessions]: Program download complete');
                this.setState({
                    rooms: this.props.rooms,
                    sessions: this.props.sessions,
                    items: this.props.items,
                    loading: false
                });
            }
            else {
                console.log('[Admin/Sessions]: Program still downloading...' + this.state.loading);
                if (prevProps.rooms.length != this.props.rooms.length) {
                    this.setState({gotRooms: true});
                    console.log('[Admin/Sessions]: got rooms');
                }
                if (prevProps.sessions.length != this.props.sessions.length) {
                    this.setState({gotSessions: true});
                    console.log('[Admin/Sessions]: got sessions');
                }
                if (prevProps.items.length != this.props.items.length) {
                    this.setState({gotItems: true});
                }
            }
        }
        else {
            if (prevProps.rooms.length != this.props.rooms.length) {
                this.setState({rooms: this.props.rooms});
                console.log('[Admin/Sessions]: changes in rooms');
            }
            if (prevProps.sessions.length != this.props.sessions.length) {
                let sortedSessions = [...this.props.sessions];
                sortedSessions.sort((s1, s2) => s1.get("startTime") - s2.get("startTime"));

                this.setState({sessions: sortedSessions});
                console.log('[Admin/Sessions]: changes in sessions');
            }
            if (prevProps.items.length != this.props.items.length) {
                this.setState({items: this.props.items});
                console.log('[Admin/Sessions]: changes in items')
            }
        }
    }

    refreshList(){
        let query = new Parse.Query("ProgramSession");
        console.log('Current conference: ' + this.props.auth.currentConference.get('name'));
        query.equalTo("conference", this.props.auth.currentConference);
        query.limit(1000);
        query.find().then(res=>{
            console.log('Found sessions ' + res.length);
            this.setState({
                sessions: res
            });
        })
    }

    componentWillUnmount() {
        // this.sub.unsubscribe();
    }

    render() {
        const columns = [
            {
                title: 'Title',
                dataIndex: 'title',
                key: 'title',
                width: '20%',
                sorter: (a, b) => {
                    var titleA = a.get("title") ? a.get("title") : "";
                    var titleB = b.get("title") ? b.get("title") : "";
                    return titleA.localeCompare(titleB);
                },
                render: (text, record) => <span>{record.get("title")}</span>,
            },
            {
                title: 'Start Time',
                dataIndex: 'start',
                width: '12%',
                sorter: (a, b) => {
                    var timeA = a.get("startTime") ? a.get("startTime") : new Date();
                    var timeB = b.get("startTime") ? b.get("startTime") : new Date();
                    return timeA > timeB;
                },
                render: (text,record) => <span>{timezone(record.get("startTime")).tz(timezone.tz.guess()).format("YYYY-MM-DD HH:mm z")}</span>,
                key: 'start',
            },
            {
                title: 'End Time',
                dataIndex: 'end',
                width: '12%',
                sorter: (a, b) => {
                    var timeA = a.get("endTime") ? a.get("endTime") : new Date();
                    var timeB = b.get("endTime") ? b.get("endTime") : new Date();
                    return timeA > timeB;
                },
                render: (text,record) => <span>{timezone(record.get("endTime")).tz(timezone.tz.guess()).format("YYYY-MM-DD HH:mm z")}</span>,
                key: 'end',
            },
            {
                title: 'Room',
                dataIndex: 'room',
                width: '12%',
                sorter: (a, b) => {
                    var roomA = a.get("room") ? a.get("room").get("name") : "";
                    var roomB = b.get("room") ? b.get("room").get("name") : "";
                    return roomA.localeCompare(roomB);
                },
                render: (text,record) => <span>{record.get("room") ? record.get("room").get('name') : ""}</span>,
                key: 'room',
            },
            {
                title: 'Items',
                dataIndex: 'items',
                render: (text,record) => {
                    if (record.get("items")) {
                        return <ul>{
                            record.get("items").map(item => (
                                <li key={item.id}>
                                    {item.get('title')}
                                </li>
                            ))
                        }</ul>}
                },
                key: 'items',
            },
            {
                title: 'Action',
                key: 'action',
                render: (text, record) => (
                    <Space size="small">
                        <a href="#" title="Edit" session={record} onClick={() => this.onEdit(record)}>{<EditOutlined />}</a>
                        <Popconfirm
                            title="Are you sure delete this session?"
                            onConfirm={()=>this.onDelete(record)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <a href="#" title="Delete">{<DeleteOutlined />}</a>
                        </Popconfirm>
                    </Space>
                ),
            },
        ];

        if (!this.props.downloaded)
            return (
                <Spin tip="Loading...">
                </Spin>)

        else if (this.state.editing)
            return (
                <Fragment>
                    <CollectionEditForm
                        title="Edit Session"
                        visible={this.state.visible}
                        data={this.state.edt_session}
                        onAction={this.onUpdate.bind(this)}
                        onCancel={() => {
                            this.setVisible(false);
                            this.setState({editing: false});
                        }}
                        rooms={this.state.rooms}
                        items={this.state.items}
                        myItems={this.state.edt_session.items ? this.state.edt_session.items : []}
                    />
                    <Input.Search/>
                    <Table 
                        columns={columns} 
                        dataSource={this.state.searched ? this.state.searchResult : this.state.sessions} 
                        rowKey={(t)=>(t.id)}>
                    </Table>
                </Fragment>
            )
        return <div>
            <Button
                type="primary"
                onClick={() => {
                    this.setVisible(true);
                }}
            >
                New session
            </Button>
            <CollectionEditForm
                title="Add Session"
                visible={this.state.visible}
                onAction={this.onCreate.bind(this)}
                onCancel={() => {
                    this.setVisible(false);
                }}
                rooms={this.state.rooms}
                items={this.state.items}
                myItems={[]}
            />
            <Input.Search
                allowClear
                onSearch={key => {
                        if (key == "") {
                            this.setState({searched: false});
                        }
                        else {
                            this.setState({searched: true});
                            this.setState({
                                searchResult: this.state.sessions.filter(
                                    session => (session.get('title') && session.get('title').toLowerCase().includes(key.toLowerCase())) 
                                        || (session.get('startTime') && timezone(session.get("startTime")).tz(timezone.tz.guess()).format("YYYY-MM-DD HH:mm z").toLowerCase().includes(key.toLowerCase())) 
                                        || (session.get('endTime') && timezone(session.get("endTime")).tz(timezone.tz.guess()).format("YYYY-MM-DD HH:mm z").toLowerCase().includes(key.toLowerCase())) 
                                        || (session.get('items') && session.get('items').some((element) => element.get('title').toLowerCase().includes(key.toLowerCase())))
                                        || (session.get('room') && session.get('room').get('name').toLowerCase().includes(key.toLowerCase())))      
                            })
                        }
                    }         
                }
            />      
            <Table 
                columns={columns} 
                pagination={false}
                dataSource={this.state.searched ? this.state.searchResult : this.state.sessions} 
                rowKey={(t)=>(t.id)}>
            </Table>
        </div>
    }

}

const AuthConsumer = (props) => (
    <ProgramContext.Consumer>
        {({rooms, tracks, items, sessions, people, onDownload, downloaded}) => (
            <AuthUserContext.Consumer>
                {value => (
                    <ProgramSessions {...props} auth={value} rooms={rooms} tracks={tracks} items={items} sessions={sessions} onDown={onDownload} downloaded={downloaded}/>
                )}
            </AuthUserContext.Consumer>
        )}
    </ProgramContext.Consumer>

);
export default AuthConsumer;

const CollectionEditForm = ({title, visible, data, onAction, onCancel, rooms, items, myItems}) => {
    const [form] = Form.useForm();
    const myItemTitles = [];
    myItems.map(item => {
        myItemTitles.push(item.get('title'));
    })
    // console.log("total number of items is: " + items.length);
    return (
        <Modal
            visible={visible}
            title={title}
            // okText="Create"
            footer={[
                <Button form="myForm" key="submit" type="primary" htmlType="submit">
                    Submit
                </Button>
            ]}
            cancelText="Cancel"
            onCancel={onCancel}
        >
            <Form
                form={form}
                layout="vertical"
                name="form_in_modal"
                id="myForm"
                initialValues={{
                    modifier: 'public',
                    ...data
                }}
                onFinish={() => {
                    form
                        .validateFields()
                        .then(values => {
                            form.resetFields();
                            onAction(values);
                        })
                        .catch(info => {
                            console.log('Validate Failed:', info);
                        });
                }}
            >
                <Form.Item name="objectId" noStyle>
                    <Input type="text" type="hidden" />
                </Form.Item>

                <Form.Item name="roomId" noStyle>
                    <Input type="text" type="hidden" />
                </Form.Item>

                <Form.Item
                    name="title"
                    label="Title"
                    rules={[
                        {
                            required: true,
                            message: 'Please input the title of the session!',
                        },
                    ]}
                >
                    <Input placeholder="Name"/>
                </Form.Item>

                <Form.Item name="dates">
                    <Input.Group compact>
                        <Form.Item name="startTime" label="Start time"
                                   rules={[
                                       {
                                           required: true,
                                           message: 'Required!',
                                       },
                                   ]}
                        >
                            <DatePicker showTime/>
                        </Form.Item>
                        <Form.Item name="endTime" label="End time"
                                   rules={[
                                       {
                                           required: true,
                                           message: 'Required!',
                                       },
                                   ]}
                        >
                            <DatePicker showTime/>
                        </Form.Item>
                    </Input.Group>
                </Form.Item>

                <Form.Item
                    label="Current items"
                >
                    <Space>
                        <Select
                            placeholder="Choose a current item"
                            style={{ width: 400 }}
                            defaultValue={myItemTitles.length > 0 ? myItemTitles[0]: []}
                        >
                            {myItems.map(item => (
                                <Option
                                    key={item.id}
                                    value={item.get('title')}
                                >
                                    {item.get('title')}
                                </Option>
                            ))}
                        </Select>
                        <a href="#" title="Edit" >{<EditOutlined />}</a>

                        <Popconfirm
                            title="Are you sure to delete this item?"
                            okText="Yes"
                            cancelText="No"
                        >
                            <a href="#" title="Delete">{<DeleteOutlined />}</a>
                        </Popconfirm>
                    </Space>

                </Form.Item>

                <Form.Item
                    label="Add new items"
                >
                    <Select
                        placeholder="Choose new items"
                        style={{ width: 400 }}
                        defaultValue={[]}
                        mode="multiple"
                        optionLabelProp="label"
                    >
                        {items.map(item => {
                            if (!myItemTitles.includes(item.get('title'))) {
                                return <Option
                                    key={item.id}
                                    value={item.get('title')}
                                    label = {item.get('title').length > 5 ? item.get('title').substring(0, 5)+"..." : item.get('title')}>
                                    {item.get('title')}
                                </Option>
                            }
                        })}
                    </Select>
                </Form.Item>

                <Form.Item name="room" label="Room"
                           rules={[
                               {
                                   required: true,
                                   message: 'Please input the room the session!',
                               },
                           ]}
                >
                    <Select placeholder="Choose the room" style={{ width: 400 }} >
                        {rooms.map(r => (
                            <Option key={r.id}>{r.get('name')}</Option>
                        ))}
                    </Select>
                </Form.Item>

            </Form>
        </Modal>
    );
};