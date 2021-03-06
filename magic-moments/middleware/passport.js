let LocalStrategy = require('passport-local').Strategy
let nodeifyit = require('nodeifyit')
let User = require('../models/user')

module.exports = (app) => {
  let passport = app.passport

  passport.serializeUser(nodeifyit(async (user) => user._id))
  passport.deserializeUser(nodeifyit(async (id) => {
    return await User.promise.findById(id)
  }))

  passport.use(new LocalStrategy({
    // Use "email" field instead of "username"
    usernameField: 'email',
    failureFlash: true
  }, nodeifyit(async (email, password) => {
     let user
     if(email.indexOf('@')) {   
        email = email.toLowerCase() 
        user = await User.promise.findOne({email})
     }
     else{
       let regexp =  new RegExp(email, 'i')
       user = await User.promise.findOne({
       email: {$regexp: regexp} 
     })
    }
    
    if (!user || email !== user.email) {
      return [false, {message: 'Invalid email'}]
    }
    
    if (!await user.validatePassword(password)) {
      return [false, {message: 'Invalid password'}]
    }
    return user
  }, {spread: true})))


  passport.use('local-signup', new LocalStrategy({
    // Use "email" field instead of "username"
    usernameField: 'email',
    failureFlash: true,
    passReqToCallback: true
  }, nodeifyit(async (req, email, password) => {    
    email = (email || '').toLowerCase()
    // Is the email taken?
    if (await User.promise.findOne({email})) {
      return [false, {message: 'That email is already taken.'}]
    }
      
    let {fullname} = req.body

    let regexp =  new RegExp(email, 'i')
    let query = {
      username: {$regex: regexp}
    }

    if(await User.promise.findOne(query)) {
     return [false, {message: 'That username is already taken.'}] 
    }

    // create the user
    let user = new User()
    user.fullname = fullname
    user.email = email    
    user.password = password;


    try{
      return await user.save()
    }catch(e) {
      console.log(e.stack)
      return [false, {message: e.message}]
    }   
           
  }, {spread: true})))
}
