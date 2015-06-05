 module.exports = (app) => {
        app.get('/', (req, res) => res.render('index.ejs'))
        app.post('/', (req, res) => {
            // TODO: Save username to req.session.username
            req.session.username =
            req.body.username;
            res.redirect('/chat')
        })
        app.get('/chat', (req, res) => {
            let username = req.session.username
            let state = JSON.stringify({username})
            res.render('chat.ejs', {username, state})
        })
    }
