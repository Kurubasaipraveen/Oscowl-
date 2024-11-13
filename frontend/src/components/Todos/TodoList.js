import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import TodoItem from './TodoItem';
import AddTodo from './AddTodo';

const TodoList = () => {
    const [todos, setTodos] = useState([]);

    useEffect(() => {
        const fetchTodos = async () => {
            const token = localStorage.getItem('token');
            const { data } = await api.get('/todos', {
                headers: { Authorization: token },
            });
            setTodos(data);
        };

        fetchTodos();
    }, []);

    return (
        <div className="todo-container">
            <h2>Your Todos</h2>
            <AddTodo setTodos={setTodos} />
            <ul>
                {todos.map((todo) => (
                    <TodoItem key={todo._id} todo={todo} setTodos={setTodos} />
                ))}
            </ul>
        </div>
    );
};

export default TodoList;
