import React, { useState } from 'react';
import api from '../../services/api';

const AddTodo = ({ setTodos }) => {
    const [title, setTitle] = useState('');

    const handleAdd = async () => {
        const token = localStorage.getItem('token');
        const { data } = await api.post(
            '/todos',
            { title },
            { headers: { Authorization: token } }
        );
        setTodos((prev) => [...prev, data]);
        setTitle('');
    };

    return (
        <div>
            <input
                type="text"
                value={title}
                placeholder="Add a new task"
                onChange={(e) => setTitle(e.target.value)}
            />
            <button onClick={handleAdd}>Add</button>
        </div>
    );
};

export default AddTodo;
