let isLoggedIn = require('./middlewares/isLoggedIn')
let Twitter = require('twitter')
let request = require('request');
let Facebook = require('facebook-node-sdk')
let nodeify = require('bluebird-nodeify')
let then = require('express-then')
let Promise = require("bluebird")
let nodeifyit = require('nodeifyit')

Promise.promisifyAll(Facebook)
let _ = require('lodash')


require('songbird');

module.exports = (app) => {
    let passport = app.passport
    let twitterConfig = app.config.auth.twitterAuth
    let googleConfig = app.config.auth.googleAuth
    let networks = {
        twitter: {
              icon: 'twitter',
              name: 'twitter',
              class: 'btn-primary'
        },
        facebook: {
              icon: 'facebook',
              name: 'facebook',
              class: 'btn-primary'
        },
        googlePlus: {
              icon: 'googlePlus',
              name: 'googlePlus',
              class: 'btn-primary'
        }
    }

    // Twitter Timeline
    app.get('/timeline', isLoggedIn, then(async (req, res) => {
        try{
            var posts = [];
            var count = 5;
            let user = req.user;
                
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })

            console.log('consumerKey: ' + twitterConfig.consumerKey)
            console.log('consumerSecret: ' + twitterConfig.consumerSecret)
            console.log('access_token_key: ' + req.user.twitter.token)
            console.log('access_token_secret: ' + req.user.twitter.tokenSecret)
            let [tweets] = await twitterClient.promise.get('statuses/home_timeline', {count: count})
            tweets = tweets.map(tweet => {
              let createdTS = Date.parse(tweet.created_at);
              let createdTime = new Date();
              posts.push({
                key: createdTS,
                id: tweet.id_str,
                image: tweet.user.profile_image_url ?tweet.user.profile_image_url : '/images/social.png',
                text: tweet.text,
                name: tweet.user.name,
                username: '@' + tweet.user.screen_name,
                liked: tweet.favorited,
                created_time: createdTime.toUTCString(),
                network: {
                    icon: 'twitter',
                    name: 'twitter',
                    class: 'btn-primary'
                  }
              })
            })

            //facebook feed
            // Specify the URL and query string parameters needed for the request
            let url = 'https://graph.facebook.com/v2.2/me/feed?fields=id,from,likes,message,picture&access_token=' + req.user.facebook.token;
              // Send the request
              let [,fbfeed] = await request.promise.get({url: url});
              fbfeed = JSON.parse(fbfeed);
          
              if (fbfeed.error) return console.error("Error returned from facebook: ", fbfeed.error);

              //set up all 3rd party strategies
              _.forIn(fbfeed.data, (val, key) => {
                let createdTS = Date.parse(val.created_time);
                let createdTime = new Date();
                createdTime.setTime(createdTS);
                posts.push({
                  key: createdTS,
                  id: val.id,
                  image: val.picture ? val.picture : "/images/social.png",
                  text: val.message,
                  name: val.from.name ? val.from.name : "",
                  username: req.user.facebook.email,
                  created_time: createdTime.toUTCString(),
                  liked: val.likes ?  true : false,
                  network: {
                    icon: 'facebook',
                    name: 'Facebook',
                    class: 'btn-primary'
                  }
                })
              })

            res.render('timeline.ejs', {
                posts: posts
            })}catch(e){
              console.log(e)
              //e.stack()
            }
    }))

    // Post Tweets
    app.get('/compose', isLoggedIn, (req, res) => {
        res.render('compose.ejs', {
            message: req.flash('error')
        })
    })

    // Post Tweets
    app.post('/compose', isLoggedIn, then(async (req, res) => {
        let status = req.body.text
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.tokenSecret
        })
        if(status.length > 140){
            return req.flash('error', 'Status is over 140 characters!')
        }

        if(!status){
            return req.flash('error', 'Status cannot be empty!')
        }
        await twitterClient.promise.post('statuses/update', {status})
        let url = 'https://graph.facebook.com/v2.2/me/feed?message=' + status +'&access_token=' + req.user.facebook.token
        console.log('URL: ' + url)
         await request.promise.post(url,
            nodeifyit(async (error, response, body) => {
              if (!error && response.statusCode === 200) {
                let dataFromServer = JSON.parse(body)
                console.log('Reply from Facebook: ' + JSON.stringify(dataFromServer))
              } else {
                console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
              }
             res.redirect('/timeline')
             }, {spread: true}))

    }))

    // Like
    app.post('/like/:network/:id', isLoggedIn, then(async (req, res) => {

        let network = req.params.network
        let id = req.params.id
         console.log('network' + network);
        if(network === "twitter"){
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })
            await twitterClient.promise.post('favorites/create', {id})
            res.end()
        } else if(network === "Facebook") {
            console.log('Like the post: ' + id)
            let postId = id.split('_')
            let url = 'https://graph.facebook.com/v2.2/' + postId[1] + '/likes?access_token=' + req.user.facebook.token
            console.log('URL: ' + url)
             await request.promise.post(url,
                nodeifyit(async (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                    let dataFromServer = JSON.parse(body)
                    let data = dataFromServer.data
                    console.log('Reply from Facebook: ' + JSON.stringify(data))
                  } else {
                    console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
                  }
                res.end()
                 }, {spread: true}))
        }
    }))

    // UnLike
    app.post('/unlike/:network/:id', isLoggedIn, then(async (req, res) => {
        let network = req.params.network
        let id = req.params.id
        if(network === "twitter"){
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })
            await twitterClient.promise.post('favorites/destroy', {id})
            res.end()
        } else if(network === "Facebook") {
            console.log('Remove like for the post: ' + id)
            let postId = id.split('_')
            let url = 'https://graph.facebook.com/v2.2/' + postId[1] + '/likes?access_token=' + req.user.facebook.token
            console.log('URL: ' + url)
             await request.promise.del(url,
                nodeifyit(async (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                    let dataFromServer = JSON.parse(body)
                    let data = dataFromServer.data
                    console.log('Reply from Facebook: ' + JSON.stringify(data))
                  } else {
                    console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
                  }
                res.end()
                 }, {spread: true}))
        }
    }))

   //  Reply
    app.get('/reply/:network/:id', isLoggedIn, then(async (req, res) => {
        let network = req.params.network
        let id = req.params.id
        console.log('reply from network'+network);
        if(network === 'twitter'){
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })
            let [tweet] = await twitterClient.promise.get('statuses/show/', {id})
              let post = {
                id: tweet.id_str,
                image: tweet.user.profile_image_url,
                text: tweet.text,
                name: tweet.user.name,
                username: '@' + tweet.user.screen_name,
                liked: tweet.favorited,
                network: networks.twitter
              }
            res.render('reply.ejs', {
                post: post
            })
        } else if (network === 'Facebook') {
            let url = 'https://graph.facebook.com/v2.2/' + id + '?access_token=' + req.user.facebook.token
            console.log('URL: ' + url)
            let post
             await request.promise.get(url,
                nodeifyit(async (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                    let dataFromServer = JSON.parse(body)
                    console.log('Reply from Facebook: ' + JSON.stringify(dataFromServer))
                    let isLiked = dataFromServer.likes ? true : false
                    post = {
                        id: dataFromServer.id,
                        image: '',
                        text: dataFromServer.message,
                        name: dataFromServer.from.name,
                        username: req.user.facebook.email,
                        liked: isLiked,
                        network: networks.facebook
                    }
                  } else {
                    console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
                  }
                res.render('reply.ejs', {
                    post: post
                })
                 }, {spread: true}))
        }
    }))
    

    // Reply to post
    app.post('/reply/:network/:id', isLoggedIn, then(async (req, res) => {
        let network = req.params.network
        let id = req.params.id
        let status = req.body.text
        if(network === 'twitter'){
            console.log(status)
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })
            if(status.length > 140){
                return req.flash('error', 'Status cannot be more than 140 characters!')
            }

            if(!status){
                return req.flash('error', 'Status cannot be empty!')
            }
            let id = req.params.id
            await twitterClient.promise.post('statuses/update', {status: status, in_reply_to_status_id: id})
            res.redirect('/timeline')
        } else if (network === 'facebook'){
            let url = 'https://graph.facebook.com/v2.2/' + id + '/comments?message=' + status + '&access_token=' + req.user.facebook.token
            console.log('Reply to the post on URL: ' + url)
             await request.promise.post(url,
                nodeifyit(async (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                    let dataFromServer = JSON.parse(body)
                    let data = dataFromServer.data
                    console.log('Reply from Facebook: ' + JSON.stringify(data))
                  } else {
                    console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
                  }
                res.redirect('/timeline')
                 }, {spread: true}))
        }

    }))

   // Twitter - Share
    app.get('/share/:network/:id', isLoggedIn, then(async (req, res) => {
        let network = req.params.network
        let id = req.params.id
        if(network === 'twitter'){
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })
            let [tweet] = await twitterClient.promise.get('statuses/show/', {id})
              let post = {
                id: tweet.id_str,
                image: tweet.user.profile_image_url,
                text: tweet.text,
                name: tweet.user.name,
                username: '@' + tweet.user.screen_name,
                liked: tweet.favorited,
                network: networks.twitter
              }
            res.render('share.ejs', {
                post: post
            })
        } else if (network === 'Facebook') {
            let url = 'https://graph.facebook.com/v2.2/' + id + '?access_token=' + req.user.facebook.token
            console.log('URL: ' + url)
            let post
             await request.promise.get(url,
                nodeifyit(async (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                    let dataFromServer = JSON.parse(body)
                    console.log('Reply from Facebook: ' + JSON.stringify(dataFromServer))
                    let isLiked = dataFromServer.likes ? true : false
                    post = {
                        id: dataFromServer.id,
                        image: '',
                        text: dataFromServer.message,
                        name: dataFromServer.from.name,
                        username: req.user.facebook.email,
                        liked: isLiked,
                        network: networks.facebook
                    }
                  } else {
                    console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
                  }
                res.render('share.ejs', {
                    post: post
                })
                 }, {spread: true}))
        }
    }))

 // Twitter - share
    app.post('/share/:network/:id', isLoggedIn, then(async (req, res) => {
        let network = req.params.network
        let id = req.params.id
        let status = req.body.text
        if(network === 'twitter'){
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })
            if(status.length > 140){
                return req.flash('error', 'Status cannot be more than 140 characters!')
            }

            // if(!status){
            //     return req.flash('error', 'Status cannot be empty!')
            // }
            let id = req.params.id
            console.log('id: ' + id)
            try{
                await twitterClient.promise.post('statuses/retweet/' + id)
            } catch(error){
                console.log('Error: ' + JSON.stringify(error))
            }
            res.redirect('/timeline')
        } else if (network === 'facebook'){
            let postId = id.split('_')
            let url = 'https://graph.facebook.com/v2.2/me/feed?link=https://www.facebook.com/' + postId[0] + '/posts/' + postId[1] +
                 '&message=' + status + '&access_token=' + req.user.facebook.token
            console.log('Share post URL: ' + url)
             await request.promise.post(url,
                nodeifyit(async (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                    let dataFromServer = JSON.parse(body)
                    let data = dataFromServer.data
                    console.log('Reply from Facebook: ' + JSON.stringify(data))
                  } else {
                    console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
                  }
                res.redirect('/timeline')
                 }, {spread: true}))
        }

    }))

return passport

}