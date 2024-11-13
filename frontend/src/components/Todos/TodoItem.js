import React from 'react';
import api from '../../services/api';

const TodoItem = ({ todo, setTodos }) => {
    const handleDelete = async () => {
        const token = localStorage.getItem('token');
        await api.delete(`/todos/${todo._id}`, {
            headers: { Authorization: token },
        });
        setTodos((prev) => prev.filter((t) => t._id !== todo._id));
    };

    return (
        <li>
            <span>{todo.title}</span>
            <button onClick={handleDelete}>Delete</button>
        </li>
    );
};

export default TodoItem;
