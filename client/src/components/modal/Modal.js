import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose, graphql, Query } from 'react-apollo';
import { Formik } from 'formik';
import { ModalContext, ModalConsumer } from '../../context';
import {
    GET_CUSTOMER,
    GET_CUSTOMERS,
    UPDATE_CUSTOMER,
    DELETE_CUSTOMER,
} from '../../queries';
import history from '../../history';
import s from './Modal.css';


class Modal extends Component {
    static propTypes = {
        deleteCustomer: PropTypes.func.isRequired,
        updateCustomer: PropTypes.func.isRequired,
    }

    render() {
        const { updateCustomer, deleteCustomer } = this.props;
        return (
            <ModalConsumer>
                {({ name, close }) => (
                    name && (
                        <div className={s.modal} onClick={close}>
                            <div className={s.modalInner} onClick={e => e.stopPropagation()}>
                                <button type="button" className={s.close} onClick={close} />
                                { name === 'edit' && <Edit updateCustomer={updateCustomer} />}
                                { name === 'delete' && <Delete deleteCustomer={deleteCustomer} />}
                            </div>
                        </div>
                    )
                )}
            </ModalConsumer>
        );
    }
}

export class Edit extends Component {
    static propTypes = {
        updateCustomer: PropTypes.func.isRequired,
    }

    static contextType = ModalContext;

    submit = (values) => {
        const { close } = this.context;
        const { location: { pathname } } = history;
        const id = pathname.substring(1);
        const { updateCustomer } = this.props;

        close();
        updateCustomer({
            variables: { id, ...values },
        });
    };

    render() {
        const { location: { pathname } } = history;
        const id = pathname.substring(1);

        return (
            <Query query={GET_CUSTOMER} variables={{ id }}>
                {({ loading, error, data }) => {
                    if (loading) return <p>Loading...</p>;
                    if (error) console.log(error);
                    const { customer: { name, email } } = data;

                    return (
                        <>
                            <h1>Edit data</h1>
                            <Formik
                                initialValues={{
                                    name,
                                    email,
                                }}
                                onSubmit={this.submit}
                            >
                                {({ dirty,
                                    values,
                                    isSubmitting,
                                    handleChange,
                                    handleSubmit,
                                }) => (
                                    <>
                                        <form onSubmit={handleSubmit}>
                                            <label htmlFor="name">
                                                Name
                                                <input
                                                    type="text"
                                                    id="name"
                                                    name="name"
                                                    placeholder="name"
                                                    onChange={handleChange}
                                                    value={values.name || ''}
                                                />
                                            </label>
                                            <label htmlFor="email">
                                                Email
                                                <input
                                                    type="text"
                                                    id="email"
                                                    name="email"
                                                    placeholder="email"
                                                    onChange={handleChange}
                                                    value={values.email || ''}
                                                />
                                            </label>
                                            <div className={s.buttons}>
                                                <button disabled={!dirty || isSubmitting} type="submit">Save</button>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </Formik>
                        </>
                    );
                }}
            </Query>
        );
    }
}

export class Delete extends Component {
    static propTypes = {
        deleteCustomer: PropTypes.func.isRequired,
    }

    static contextType = ModalContext;

    delete = () => {
        const { close } = this.context;
        const { deleteCustomer } = this.props;
        const { location: { pathname } } = history;
        const id = pathname.substring(1);

        close();
        deleteCustomer({ variables: { id } });
    }

    cancel = () => {
        const { close } = this.context;
        close();
    }

    render() {
        return (
            <>
                <h1>Delete this item?</h1>
                <div className={s.buttons}>
                    <button type="submit" onClick={this.delete}>Delete</button>
                    <button type="submit" onClick={this.cancel}>Cancel</button>
                </div>
            </>
        );
    }
}

export default compose(
    graphql(DELETE_CUSTOMER, {
        name: 'deleteCustomer',
        options: {
            update: (cache, { data: { deleteCustomer: { id } } }) => {
                try {
                    const { customers } = cache.readQuery({ query: GET_CUSTOMERS });
                    cache.writeQuery({
                        query: GET_CUSTOMERS,
                        data: { customers: customers.filter(customer => customer.id !== id) },
                    });
                    history.push('/');
                } catch (err) {
                    console.log(err);
                }
            },
        },
    }),
    graphql(UPDATE_CUSTOMER, { name: 'updateCustomer' }),
)(Modal);
