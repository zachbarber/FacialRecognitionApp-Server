const bodyParser = require('body-parser');
const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'password',
        database: 'smart-brain'
    }
});


const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send(db.connection.database.users);
});

app.post('/signIn', (req, res) => {
    if (req.body.email === db.connection.database.users[0].email &&
        req.body.password === db.connection.database.users[0].password) {
        res.json(db.connection.database.users[0]);
    }
    else {
        res.status(400).json('error logging in');
    }
});

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {                    
        trx.insert({
            hash: hash,
            email: email
        })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                    .returning('*')
                    .insert({
                        email: loginEmail,
                        name: name,
                        joined: new Date()
                    }).then(user => {
                        res.json(user[0]);
                    })
            })
    })
        .catch(err => res.status(400).json('Unable to register'));
});

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where({ id })
        .then(user => {
            if (user.length) {
                res.json(user[0])
            } else {
                res.status(400).json('not found')
            }
        })
        .catch(err => res.status(400).json('error getting user'));

});

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
        .increment('entries', 1)
        .returning('entries')
        .then(entries => {
            res.json(entries[0]);
        })
        .catch(err => res.status(400).json('unable to get entry count'))
});


app.listen(3000, () => {
    console.log('listening on port 3000...');
});
