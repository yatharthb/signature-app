// App.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import gql from 'graphql-tag';

const GET_USERS = gql`
  query {
    users {
      id
      username
      policy {
        id
        content
      }
    }
  }
`;

const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      id
      username
      policy {
        id
        content
      }
    }
  }
`;

const TRANSFER_POLICY = gql`
  mutation TransferPolicy($toUserId: ID!) {
    transferPolicy(toUserId: $toUserId) {
      id
      content
    }
  }
`;

function App() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    axios.post('http://localhost:4000/graphql', { query: GET_USERS.loc.source.body })
      .then(response => {
        setUsers(response.data.data.users);
      });
  }, []);

  const login = () => {
    axios.post('http://localhost:4000/graphql', {
      query: LOGIN.loc.source.body,
      variables: { username, password },
    }).then(response => {
      if (response.data.data.login) {
        setLoggedInUser(response.data.data.login);
      }
    });
  };

  const transferPolicy = (toUserId) => {
    axios.post('http://localhost:4000/graphql', {
      query: TRANSFER_POLICY.loc.source.body,
      variables: { toUserId },
    }).then(() => {
      // Refresh users
      axios.post('http://localhost:4000/graphql', { query: GET_USERS.loc.source.body })
        .then(response => {
          setUsers(response.data.data.users);
          const updatedLoggedInUser = response.data.data.users.find(u => u.id === loggedInUser.id);
          setLoggedInUser(updatedLoggedInUser);
        });
    });
  };

  if (loggedInUser) {
    return (
      <div>
        <h2>Welcome, {loggedInUser.username}</h2>
        {loggedInUser.policy
          ? (
            <div>
              <h3>Your policy:</h3>
              <p>{loggedInUser.policy.content}</p>
              <h3>Transfer policy to:</h3>
              {users.filter(u => u.id !== loggedInUser.id).map(user => (
                <button key={user.id} onClick={() => transferPolicy(user.id)}>
                  {user.username}
                </button>
              ))}
            </div>
          )
          : <p>You do not currently have a policy.</p>
        }
      </div>
    );
  } else {
    return (
      <div>
        <input type='text' value={username} onChange={e => setUsername(e.target.value)} placeholder='Username' />
        <input type='password' value={password} onChange={e => setPassword(e.target.value)} placeholder='Password' />
        <button onClick={login}>Log In</button>
      </div>
    );
  }
}

export default App;