import React, {Fragment} from 'react';
import {Button, DatePicker, Form, Input, Select, message, Modal, Popconfirm, Space, Spin, Table, Tabs, Upload} from "antd";
import {UploadOutlined } from '@ant-design/icons';
import Parse from "parse";
import {AuthUserContext} from "../../../Session";
import {ProgramContext} from "../../../Program";
import {
    DeleteOutlined,
    EditOutlined
} from '@ant-design/icons';

const { Option } = Select;

const {TabPane} = Tabs;
const IconText = ({icon, text}) => (
    <Space>
        {React.createElement(icon)}
        {text}
    </Space>
);

const LiveroomSources = ['', 'YouTube', 'Twitch', 'Facebook', 'iQIYI', 'ZoomUS', 'ZoomCN'];

class Rooms extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true, 
            rooms: [],
            gotRooms: false,
            editing: false,
            edt_room: undefined,
            searched: false,
            searchResult: ""
        };

        console.log('[Admin/Rooms]: downloaded? ' + this.props.downloaded);

        // Call to download program
        if (!this.props.downloaded) 
            this.props.onDown(this.props);
        else
            this.state.rooms = this.props.rooms;

    }

    onCreate(values) {
        var _this = this;
        // Create the Room record
        var Room = Parse.Object.extend("ProgramRoom");
        var room = new Room();
        room.set("name", values.name);
        room.set("src1", values.src1);
        room.set("id1", values.id1);
        room.set("pwd1", values.pwd1);
        room.set("src2", values.src2);
        room.set("id2", values.id2);
        room.set("pwd2", values.pwd2);
        room.set("qa", values.qa);
        room.set("conference", this.props.auth.currentConference);
        room.save().then((val) => {
            _this.setState({visible: false, rooms: [room, ...this.state.rooms]})
        }).catch(err => {
            console.log(err);
        });
    }

    onDelete(value) {
        console.log("Deleting " + value + " " + value.get("name"));
        // Delete the watchers first
        
        value.destroy().then(()=>{
            this.refreshList();
        });
    }

    onEdit(room) {
        console.log("Editing " + room.get("name") + " " + room.id);
        this.setState({
            visible: true, 
            editing: true, 
            edt_room: {
                objectId: room.id,
                name: room.get("name"),
                src1: room.get("src1"),
                pwd1: room.get("pwd1"),
                id1: room.get("id1"),
                src2: room.get("src2"),
                id2: room.get("id2"),
                pwd2: room.get("pwd2"),
                qa: room.get("qa"),
            }
        });
    }

    onUpdate(values) {
        var _this = this;
        console.log("Updating " + values.id1 + "; " + values.objectId);
        let room = this.state.rooms.find(r => r.id == values.objectId);

        if (room) {
            room.set("name", values.name);
            room.set("src1", values.src1);
            room.set("id1", values.id1);
            room.set("pwd1", values.pwd1);
            room.set("src2", values.src2);
            room.set("id2", values.id2);
            room.set("pwd2", values.pwd2);
            room.set("qa", values.qa);
            room.save().then((val) => {
                _this.setState({visible: false, editing: false});
            }).catch(err => {
                console.log(err + ": " + values.objectId);
            })
        }
        else {
            console.log("room not found: " + values.id1);
        }
    }

    setVisible() {
        this.setState({'visible': !this.state.visible});
    }

    componentDidMount() {
    }

    componentDidUpdate(prevProps) {
        console.log("[Admin/Rooms]: Something changed");

        if (this.state.loading) {
            if (this.state.gotRooms) {
                console.log('[Admin/Rooms]: Program download complete');
                this.setState({
                    rooms: this.props.rooms,
                    loading: false
                });
            }
            else {
                console.log('[Admin/Rooms]: Program still downloading...');
                if (prevProps.rooms.length != this.props.rooms.length) {
                    this.setState({gotRooms: true});
                    console.log('[Admin/Rooms]: got rooms');
                }
            }
        }
        else 
            console.log('[Admin/Rooms]: Program cached');

    }

    onChange(info) {
        console.log("onChange " + info.file.status);
        if (info.file.status !== 'uploading') {
          console.log(info.file, info.fileList);
        }
        if (info.file.status === 'done') {
          message.success(`${info.file.name} file uploaded successfully`);
        } else if (info.file.status === 'error') {
          message.error(`${info.file.name} file upload failed.`);
        }
    }


    beforeUpload(file, fileList) {
        const reader = new FileReader();
        reader.onload = () => {
            const data = {content: reader.result, conference: this.props.auth.currentConference.id};
            Parse.Cloud.run("rooms-upload", data).then(() => this.refreshList());
        }
        reader.readAsText(file);
        return false;
    } 

    refreshList(){
        let query = new Parse.Query("ProgramRoom");
//        console.log(this.props.auth);
//        let token = this.props.auth.user.getSessionToken();
//        console.log(token);
        console.log('Current conference: ' + this.props.auth.currentConference.get('name'));
        query.equalTo("conference", this.props.auth.currentConference);
        query.find().then(res=>{
            console.log('Found rooms ' + res.length);
            this.setState({
                rooms: res,
                loading: false
            });
        })
    }
    componentWillUnmount() {
        // this.sub.unsubscribe();
    }

    render() {
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                width: '10%',
                sorter: (a, b) => {
                    var nameA = a.get("name") ? a.get("name") : "";
                    var nameB = b.get("name") ? b.get("name") : "";
                    return nameA.localeCompare(nameB);
                },
                render: (text, record) => <span>{record.get("name")}</span>,
            },
            {
                title: 'Main Media Source',
                dataIndex: 'src1',
                width: '20%',
                sorter: (a, b) => {
                    var srcA = a.get("src1") ? a.get("src1") : "";
                    var srcB = b.get("src1") ? b.get("src1") : "";
                    return srcA.localeCompare(srcB);
                },
                render: (text,record) => <span>{record.get("src1")}</span>,
                key: 'roomsrc1',
            },
            {
                title: 'Media ID',
                dataIndex: 'id1',
                width: '10%',
                render: (text,record) => <span>{record.get("id1")}</span>,
                key: 'roomid1',
            },
            {
                title: 'Password',
                dataIndex: 'pwd1',
                width: '10%',
                render: (text,record) => <span>{record.get("pwd1")}</span>,
                key: 'pwd1',
            },
            {
                title: 'Alt Media Source',
                dataIndex: 'src2',
                width: '20%',
                sorter: (a, b) => {
                    var srcA = a.get("src2") ? a.get("src2") : "";
                    var srcB = b.get("src2") ? b.get("src2") : "";
                    return srcA.localeCompare(srcB);
                },
                render: (text,record) => <span>{record.get("src2")}</span>,
                key: 'roomsrc2',
            },
            {
                title: 'Alt Media ID',
                dataIndex: 'id2',
                width: '10%',
                render: (text,record) => <span>{record.get("id2")}</span>,
                key: 'roomid2',
            },
            {
                title: 'Password',
                dataIndex: 'pwd2',
                width: '10%',
                render: (text,record) => <span>{record.get("pwd2")}</span>,
                key: 'pwd2',
            },
            {
                title: 'Q&A',
                dataIndex: 'qa',
                width: '20%',
                // sorter: (a, b) => {
                //     var qaA = a.get("qa") ? a.get("qa") : "";
                //     var qaB = b.get("qa") ? b.get("qa") : "";
                //     return qaA.localeCompare(qaB);
                // },
                render: (text,record) => <span>{record.get("qa")}</span>,
                key: 'qa',
            },
            {
                title: 'Action',
                key: 'action',
                render: (text, record) => (
                    <Space size="small">
                        <a href="#" title="Edit" room={record} onClick={() => this.onEdit(record)}>{<EditOutlined/>}</a>
                        <Popconfirm
                            title="Are you sure delete this room?"
                            onConfirm={()=>this.onDelete(record)}
                            okText="Yes"
                            cancelText="No"
                        >
                        <a href="#" title="Delete">{<DeleteOutlined/>}</a>
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
                        title="Edit Room"
                        visible={this.state.visible}
                        data={this.state.edt_room}
                        onAction={this.onUpdate.bind(this)}
                        onCancel={() => {
                            this.setVisible(false);
                            this.setState({editing: false});
                        }}
                        onSelectPullDown1={(value) => {
                            this.setState({src1: value});
                        }}
                        onSelectPullDown2={(value) => {
                            this.setState({src2: value});
                        }}

                        socialSpaces={this.state.socialSpaces}
                        socialSpacesLoading={this.state.socialSpacesLoading}
                    />
                    <Input.Search/>
                    <Table 
                        columns={columns} 
                        dataSource={this.state.searched ? this.state.searchResult : this.state.rooms} 
                        rowKey={(t)=>(t.id)}>
                    </Table>
            </Fragment>
            )
        return <div>
                <table style={{width:"100%"}}>
                    <tbody>
                        <tr>
                            <td><Upload accept=".txt, .csv" onChange={this.onChange.bind(this)} beforeUpload={this.beforeUpload.bind(this)}>
                                <Button>
                                    <UploadOutlined /> Upload file
                                </Button>
                            </Upload></td>

                            <td>
                            <Button
                                type="primary"
                                onClick={() => {
                                    this.setVisible(true);
                                }}
                            >
                                New Room
                            </Button>
                            <CollectionEditForm
                                title="Add Room"
                                visible={this.state.visible}
                                onAction={this.onCreate.bind(this)}
                                onCancel={() => {
                                    this.setVisible(false);
                                }}
                                onSelectPullDown1={(value) => {
                                    this.setState({src1: value});
                                }}
                                onSelectPullDown2={(value) => {
                                    this.setState({src2: value});
                                }}
                
                                socialSpaces={this.state.socialSpaces}
                                socialSpacesLoading={this.state.socialSpacesLoading}
                            /></td>
                            <td><Input.Search
                                allowClear
                                onSearch={key => {
                                        if (key == "") {
                                            this.setState({searched: false});
                                        }
                                        else {
                                            this.setState({searched: true});
                                            this.setState({
                                                dataSource: this.state.rooms.filter(
                                                    room => 
                                                        (room.get('name') && room.get('name').toLowerCase().includes(key.toLowerCase()))
                                                        || (room.get('src1') && room.get('src1').toLowerCase().includes(key.toLowerCase()))
                                                        || (room.get('id1') && room.get('id1').toLowerCase().includes(key.toLowerCase()))
                                                        || (room.get('pwd1') && room.get('pwd1').toLowerCase().includes(key.toLowerCase()))
                                                        || (room.get('src2') && room.get('src2').toLowerCase().includes(key.toLowerCase()))
                                                        || (room.get('id2') && room.get('id2').toLowerCase().includes(key.toLowerCase()))
                                                        || (room.get('pwd2') && room.get('pwd2').toLowerCase().includes(key.toLowerCase()))
                                                        || (room.get('qa') && room.get('qa').toLowerCase().includes(key.toLowerCase())))
                                            })
                                        }
                                    }
                                }
                            /></td>
                        </tr>
                    </tbody>
                </table>
            <Table 
                columns={columns} 
                pagination={false}
                dataSource={this.state.searched ? this.state.searchResult : this.state.rooms} 
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
                    <Rooms {...props} auth={value} rooms={rooms} tracks={tracks} items={items} sessions={sessions} onDown={onDownload} downloaded={downloaded}/>
                )}
            </AuthUserContext.Consumer>
        )}
    </ProgramContext.Consumer>

);

export default AuthConsumer;

const CollectionEditForm = ({title, visible, data, onAction, onCancel, onSelectPullDown1, onSelectPullDown2, socialSpaces, socialSpacesLoading}) => {
    const [form] = Form.useForm();
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
                <Form.Item
                    name="name"
                    rules={[
                        {
                            required: true,
                            message: 'Please input the name of the room!',
                        },
                    ]}
                >
                    <Input placeholder="Name"/>
                </Form.Item>
                <Form.Item name="stream1">
                    <Input.Group compact>
                        <Form.Item name="src1">
                            <Select placeholder="Main Source" style={{ width: 120 }} onChange={onSelectPullDown1}>
                                {LiveroomSources.map(src => (
                                    <Option key={src}>{src}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="id1">
                            <Input style={{ width: '100%' }} type="textarea" placeholder="ID"/>
                        </Form.Item>
                        <Form.Item name="pwd1">
                            <Input style={{ width: '100%' }} type="textarea" placeholder="Encrypted Password (Optional)"/>
                        </Form.Item>
                    </Input.Group>
                </Form.Item>
                <Form.Item name="stream2">
                    <Input.Group compact>
                        <Form.Item name="src2" >
                            <Select placeholder="Alt. Source" style={{ width: 120 }} onChange={onSelectPullDown2}>
                                {LiveroomSources.map(src => (
                                    <Option key={src}>{src}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="id2" rules={[
                            {
                                required: false
                            },
                        ]}>
                            <Input style={{ width: '100%' }} type="textarea" placeholder="ID"/>
                        </Form.Item>
                        <Form.Item name="pwd2">
                            <Input style={{ width: '100%' }} type="textarea" placeholder="Encrypted Password (Optional)"/>
                        </Form.Item>
                    </Input.Group>
                </Form.Item>
                <Form.Item name="qa">
                    <Input placeholder="Q&A tool link"/>
                </Form.Item>
            </Form>
        </Modal>
    );
};