let isLoggedIn = require('./middleware/isLoggedIn')
let multiparty = require('multiparty')
let then  = require('express-then')
let Post = require('./models/post')
let Comment = require('./models/comment')
let fs = require('fs')
let DataUri = require('datauri')

module.exports = (app) => {
  let passport = app.passport

  app.get('/', (req, res) => {
    res.render('index.ejs')
  })

  app.get('/login', (req, res) => {
    res.render('login.ejs', {message: req.flash('error')})
  })

  app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  } ))

  app.get('/signup', (req, res) => {
    res.render('signup.ejs', {message: req.flash('error')})
  })
  
  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }))

  app.get('/profile', isLoggedIn, then(async (req, res) => {
    let allPosts = await Post.promise.find({})
    for(var k=0;k<allPosts.length;k++) {
      let postComments = await Comment.promise.find({postId :allPosts[k]._id})
      console.log('find by id '+allPosts[k]._id + "result is "+postComments)
      allPosts[k].comments = postComments
    }
    
    let allComments = await Comment.promise.find({})
    let latestComment = null
    for(var i=0;i<allComments.length;i++) {
      if(!latestComment) {
        latestComment = allComments[i]
      }
      else{
        if(latestComment.createDate.getTime()>allComments[i].createDate.getTime()) {
          latestComment = allComments[i]
        }
      }
    }
    
    res.render('profile.ejs', {
      user: req.user,
      posts: allPosts,
      latestComment: latestComment,
      message: req.flash('error')
    })
  }))

  app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
  })

  app.get('/post/:postId?', then(async (req, res) => {
    let postId = req.params.postId
    if(!postId){      
      res.render('post.ejs', {
        post: {},
        verb: 'Create'
      })    
      return
    } 

    let post = await Post.promise.findById(postId)
    if(!post) res.send(404, "Not found")

    let duri = new DataUri
    let image = duri.format("." + post.image.contentType.split("/").pop() ,
      post.image.data)
    res.render('post.ejs', {
      post: post,
      verb: 'Edit',
      image: `data:${post.image.contentType};base64,${image.base64}`     
    })
  }))

  app.post('/post/:postId?', then(async (req, res) => {
    let postId = req.params.postId
    let[{title: [title], content: [content]}, {image: [file]}] = await new multiparty.Form().promise.parse(req)
    
    if(!postId){     
      let post = new Post()
  
      post.title = title
      post.content = content
      let dateCreated = new Date()
      post.updateDate = dateCreated
      post.createDate = dateCreated
      post.image.data = await fs.promise.readFile(file.path)
      post.image.contentType = file.headers['content-type']  
      let result = await post.save()
      console.log(result);
      res.redirect(`/post/${result._id}`)
      return
    }
    let post = await Post.promise.findById(postId)
    if(!post) res.send(404, "Not found")
    console.log(title)
    post.title = title
    post.content = content
    post.updateDate = new Date()
    await post.save()
    res.redirect(`/post/${postId}`) 
    return
  }))

  app.post('/delete/:postId?', then(async (req, res) => {
    console.log('test')
    let postId = req.params.postId
    if(!postId){     
      res.send(404, "Not found")
      return
    }
    let post = await Post.promise.findById(postId)
    if(!post) res.send(404, "Not found")
    console.log("Inside delete "+ post)
    await post.promise.remove();
    res.redirect('/profile') 
    return
  }))

  app.get('/blog/:postId?', then(async (req, res) => {
    let postId = req.params.postId
    if(!postId){      
      res.redirect('/profile') 
      return
    } 

    let post = await Post.promise.findById(postId)
    if(!post) res.send(404, "Not found")

    let comments = await Comment.promise.find({postId: postId}); 
    post.comments = comments
    let duri = new DataUri
    let image = duri.format("." + post.image.contentType.split("/").pop() ,
      post.image.data)
    res.render('blog.ejs', {
      user: req.user,
      post: post,
      image: `data:${post.image.contentType};base64,${image.base64}`  ,
      message: req.flash('error')
    })
  }))

  app.post('/comment/:postId?', then(async (req, res) => {
    let postId = req.params.postId
    if(!postId){      
      res.send(404, "Not found")
    } 

    let post = await Post.promise.findById(postId)
    if(!post) res.send(404, "Not found")

    let commentObj = new Comment();

    commentObj.comment = req.body.commentElem
    commentObj.postId = post._id
    commentObj.username = req.user.username
    let createdDate = new Date();
    commentObj.createDate = createdDate
    commentObj.updateDate = createdDate

    await commentObj.save()

    let comments = await Comment.promise.find({})
    post.comments = comments
    let duri = new DataUri
    let image = duri.format("." + post.image.contentType.split("/").pop() ,
      post.image.data)
    res.render('blog.ejs', {
      user: req.user,
      post: post,
      image: `data:${post.image.contentType};base64,${image.base64}`  ,
      message: req.flash('error')
    })
  }))

}