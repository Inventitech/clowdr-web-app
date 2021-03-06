import React from 'react';
import {Button, Checkbox, Form, Input, Spin} from "antd";
import Avatar from "./Avatar";

class AccountForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {'loading': true};
        this.userRef = this.props.firebase.db.ref("users").child(this.props.uid);
    }

    componentDidMount() {
        this.userRef.once("value").then((val) => {
            let data = val.val();
            this.setState({
                loading: false,
                username: this.props.user.username,
                email: this.props.user.email,
                affiliation: data.affiliation
            });
        });

    }

    updateUser() {
        this.setState({updating: true});
        this.userRef.update({
            affiliation: this.state.affiliation,
            username: this.state.username
        }).then(async () => {
            await this.props.firebase.auth.currentUser.updateProfile({
                displayName: this.state.username
            });
            this.setState({updating: false});
        });
    }

    onChange = event => {
        this.setState({[event.target.name]: event.target.value});
    };

    onChangeCheckbox = event => {
        this.setState({[event.target.name]: event.target.checked});
    };

    render() {
        if (this.state.loading || !this.props.firebase.auth.currentUser) {
            return (
                <Spin tip="Loading...">
                </Spin>)
        }
        const {
            username,
            email,
            passwordOne,
            passwordTwo,
            isAdmin,
            error,
        } = this.state;

        const isInvalid =
            passwordOne !== passwordTwo ||
            passwordOne === '' ||
            email === '' ||
            username === '';
        return (
            <Form onFinish={this.updateUser.bind(this)} labelCol={{
                span: 4,
            }}
                  wrapperCol={{
                      span: 14,
                  }}
                  layout="horizontal"
                  initialValues={{
                      size: 50,
                  }}
                  size={100}>
                <Form.Item
                    label="Full Name"
                    rules={[
                        {
                            required: true,
                            message: 'Please input your full name',
                        },
                    ]}
                ><Input name="displayName" value={this.state.username} onChange={this.onChange}/></Form.Item>
                <Form.Item
                    label="Email Address"
                    rules={[
                        {
                            required: true,
                            message: 'Please input your email',
                        },
                    ]}
                >
                    <Input
                        name="email"
                        value={this.state.email}
                        disabled={true}
                        type="text"
                        onChange={this.onChange}/>
                </Form.Item>
                <Form.Item
                    label="Affiliation">
                    <Input
                        name="affiliation"
                        value={this.state.affiliation}
                        disabled={this.state.updating}
                        type="text"
                        onChange={this.onChange}/>
                </Form.Item>
                <Form.Item label="Profile Photo">
                    <Avatar user={this.props.user} firebase={this.props.firebase}
                            imageURL={this.props.firebase.auth.currentUser.photoURL}/>
                </Form.Item>
                <Form.Item
                    label="Admin"
                ><Checkbox
                    disabled={this.state.updating}
                    name="isAdmin"
                    type="checkbox"
                    checked={isAdmin}
                    onChange={this.onChangeCheckbox}
                />
                </Form.Item>
                <Button type="primary" htmlType="submit" disabled={isInvalid} onClick={this.onSubmit}
                        loading={this.state.updating}>
                    Save
                </Button>

                {error && <p>{error.message}</p>}
            </Form>);
    }
}

export default AccountForm;