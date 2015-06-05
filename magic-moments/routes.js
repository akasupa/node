let isLoggedIn = require('./middleware/isLoggedIn')
let then = require('express-then')
let multiparty = require('multiparty')

let fs = require('fs')
let uuid = require('node-uuid');
let http = require("http")
let Image = require('./models/images')
let easyimg = require('thumbnail');
let Group = require('./models/group')
let jsonQuery = require('json-query')
var Thumbnail = require('thumbnail');
var thumbnail = new Thumbnail('temp', 'temp/thumbnail')
var path = require("path")
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport();

async function getFilteredGroups(userEmail) {
    //let allGroups = await Group.promise.find({});
     let allGroups = await Group.promise.find({$or: [{"memberList.email": userEmail}, {"createdBy": userEmail}]})

    //let filteredGroups = [];
    //Filter based on created by and membership
    for (var i = 0; i < allGroups.length; i++) {
        console.log(allGroups[i])
        var groupElm = allGroups[i];
        var isMember = false;
        if(allGroups[i].createdBy != userEmail) {
            isMember = true;
        }

        var memList = groupElm.memberList;
        if (memList && memList.length > 0) {
            var finalEmailList = '';
            for (var j = 0; j < memList.length; j++) {
                var memElem = memList[j]
                finalEmailList += memElem.email + ';'
            }
            groupElm.emailList = finalEmailList;
        }

        groupElm.enableEdit = !isMember
        groupElm.enableRemove = !isMember
        groupElm.enableUnsubscribe = isMember
    }
    return allGroups
}


module.exports = (app) => {
    let passport = app.passport

    app.get('/', (req, res) => {
        res.render('pages/index.ejs', {message: req.flash('error')})
    })

    app.post('/', passport.authenticate('local', {
        successRedirect: '/home',
        failureRedirect: '/',
        failureFlash: true
    }))

    app.get('/signup', (req, res) => {
        res.render('pages/signup.ejs', {message: req.flash('error')})
    })

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/home',
        failureRedirect: '/signup',
        failureFlash: true
    }))


    app.get('/home', isLoggedIn, then(async(req, res)=> {

        let emailId = req.user.email
        let grouplist = await Group.promise.find({$or: [{"memberList.email": emailId}, {"createdBy": emailId}]})


        let groups = [];

        for (var i = 0; i < grouplist.length; i++) {

            let status = jsonQuery('memberList[email=' + emailId + '].viewed', {data: grouplist[i]}).value

            groups.push({
                "id": grouplist[i]._id,
                "name": grouplist[i].name,
                "createdBy": grouplist[i].createdBy,
                "email": emailId,
                "viewed": status
            })


            // Fetch groups that user is member of

            for (var i = 0; i < groups.length; i++) {
                groups[i].images = [];
                let images = await Image.promise.find({groupId: groups[i].id})
                for (var k = 0; k < images.length; k++) {
                    groups[i].images.push({
                        "imageId": images[k].imageId,
                        "title": images[k].title,
                        "createdBy": images[k].addedBy,
                        "canDelete": images[k].addedBy === req.user.email
                    })
                }
            }

        }
        res.render('pages/home', {
            groups: groups,
            groupId: req.query.groupId,
            user: req.user
        })
    }))

    // Add the Image within a group
    app.post('/images/add', isLoggedIn, then(async(req, res) => {
        console.log("Adding images ")
        let [{title: [title],groupId: [groupId], addedBy:[addedBy]}, {image: [file]}] = await new multiparty.Form().promise.parse(req)
        let image = new Image()
        image.title = title
        image.addedBy = req.user.email
        image.groupId = groupId
        image.imageId = uuid.v4()
        image.createdDate = new Date()

        if (file.originalFilename && file.originalFilename !== '') {
            image.imageData.data = await fs.promise.readFile(file.path)
            image.imageData.contentType = file.headers['content-type']
            await fs.promise.writeFile("temp/" + file.originalFilename, image.imageData.data);
            thumbnail.ensureThumbnail(file.originalFilename, 100, null, function (err, filename) {
                console.log(err)
            });
        }
        await image.save()

        let group = await Group.promise.findById(groupId)
        if (group) {
            if (group.memberList && group.memberList.length > 0) {
                for (var cnt = 0; cnt < group.memberList.length; cnt++) {
                    if (group.memberList[cnt].email != req.user.email) {
                        group.memberList[cnt].viewed = false;
                    }
                }
            }
            await group.promise.save();
        }
        console.log(group)
        res.redirect('/home?groupId=' + groupId)
    }))


    // Delete the image
    app.get('/image/delete/:imageId', isLoggedIn, then(async(req, res) => {
        let imageId = req.params.imageId
        let groupId = req.query.groupId
        await Image.remove({imageId: imageId})
        res.redirect('/home?groupId=' + groupId)
    }))

    app.get('/images/get/:imageId', isLoggedIn, then(async(req, res) => {
        let thumbnail = req.query.thumbnail;
        var imageId = req.params.imageId;
        let actualImageId = path.basename(imageId, path.extname(imageId))
        var imageData;
        let image = await Image.promise.findOne({imageId: actualImageId})

        if (image) {
            imageData = image.imageData.data;
            res.writeHead('200', {'Content-Type': image.imageData.contentType});
        } else {
            //Load Image data from mongo

            var s = __dirname + '/views/public/temp/' + imageId
            imageData = await fs.promise.readFile(s)
            res.writeHead('200', {'Content-Type': 'image/jpeg'});
        }
        res.end(imageData, 'binary');
    }))


    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/')
    })

    app.post('/createGroup', isLoggedIn, then(async (req, res) => {
        var groupName = req.body.groupName
        var memberList = req.body.memberList
        var createdBy = req.user.email

        let grpObj = await Group.promise.find({name: groupName});

        if (grpObj.length > 0) {
            let filteredGroups = await getFilteredGroups(req.user.email)

            res.render('pages/manage-groups.ejs', {
                user: req.user,
                groups: filteredGroups,
                message: 'Group name already exists!',
                verb: req.user.fullname
            })
            return
        }

        let group = new Group()

        group.name = groupName
        group.createdBy = createdBy
        let dateCreated = new Date()
        group.updateDate = dateCreated
        group.createDate = dateCreated
        var memberArr = memberList.split(";");
        var newMemberArr = [];
        for (var i = 0; i < memberArr.length; i++) {
            var member = new Object();
            member.email = memberArr[i]
            newMemberArr.push(member);
        }
        console.log('createGroup '+newMemberArr);
        group.memberList = newMemberArr

        let result = await group.save()

        if (memberList && memberList.length > 0) {
            console.log('Sending emails');
            transporter.sendMail({
                from: createdBy,
                to: memberList,
                subject: 'Share Magic Moments',
                text: "Copy and paste this URL in your browser to start viewing " + req.user.fullname + "'s moments : http://localhost:8000/"
            });
        }

        let filteredGroups = await getFilteredGroups(req.user.email)
        res.render('pages/manage-groups.ejs', {
            user: req.user,
            groups: filteredGroups,
            message: req.flash('error'),
            verb: req.user.fullname
        })

    }))

    app.post('/unsubscribe', then(async (req, res) => {
        let groupId = req.body.unsubscribeGroupId
        var loggedInUser = req.user.email
        var createdBy = req.user.email

        if (!groupId) {
            let filteredGroups = await getFilteredGroups(req.user.email)
            res.render('pages/manage-groups.ejs', {
                user: req.user,
                groups: filteredGroups,
                message: 'Invalid group ID sent. Cannot unsubscribe group.',
                verb: req.user.fullname
            })
            return
        }

        let group = await Group.promise.findById(groupId)
        if (!group) {
            let filteredGroups = await getFilteredGroups(req.user.email)
            res.render('pages/manage-groups.ejs', {
                user: req.user,
                groups: filteredGroups,
                message: 'Cannot find group ID in DB. Cannot unsubscribe group.',
                verb: req.user.fullname
            })
            return
        }

        var currentMemberList = group.memberlist
        var index = -1;
        if (currentMemberList) {
            for (var i = 0; i < currentMemberList.length; i++) {
                if (currentMemberList[i] == loggedInUser) {
                    index = i;
                }
            }
        }

        if (index > -1) {
            delete currentMemberList[index];
        }

        group.memberList = currentMemberList;
        await group.promise.save();
        let filteredGroups = await getFilteredGroups(req.user.email)

        res.render('pages/manage-groups.ejs', {
            user: req.user,
            groups: filteredGroups,
            message: req.flash('error'),
            verb: req.user.fullname
        })
    }))


    app.get('/manage-groups', isLoggedIn, then(async (req, res) => {
        let filteredGroups = await getFilteredGroups(req.user.email)

        res.render('pages/manage-groups.ejs', {
            user: req.user,
            groups: filteredGroups,
            message: req.flash('error'),
            verb: req.user.fullname
        })
    }))

    app.post('/deleteGroup', then(async (req, res) => {
        let groupId = req.body.removeGroupId
        var createdBy = req.user.email

        if (!groupId) {
            let filteredGroups = await getFilteredGroups(req.user.email)
            res.render('pages/manage-groups.ejs', {
                user: req.user,
                groups: filteredGroups,
                message: 'Invalid group ID sent. Cannot delete group.',
                verb: req.user.fullname
            })
            return
        }
        let group = await Group.promise.findById(groupId)
        if (!group) {
            let filteredGroups = await getFilteredGroups(req.user.email)
            res.render('pages/manage-groups.ejs', {
                user: req.user,
                groups: filteredGroups,
                message: 'Cannot find group ID in DB. Cannot delete group.',
                verb: req.user.fullname
            })
            return
        }
        await group.promise.remove();
        let filteredGroups = await getFilteredGroups(req.user.email)

        res.render('pages/manage-groups.ejs', {
            user: req.user,
            groups: filteredGroups,
            message: req.flash('error'),
            verb: req.user.fullname
        })
    }))

    app.post('/editGroup', isLoggedIn, then(async (req, res) => {
        let groupId = req.body.editGroupId
        var groupName = req.body.groupName
        var memberList = req.body.memberList
        var createdBy = req.user.email

        let grpObj = await Group.promise.findById(groupId)
        let oldmemberList = grpObj.memberList;

        if (grpObj) {

            grpObj.name = groupName
            let dateCreated = new Date()
            grpObj.updateDate = dateCreated
            var memberArr = memberList.split(";");
            var newMemberArr = [];
            for (var i = 0; i < memberArr.length; i++) {
                var member = new Object();
                member.email = memberArr[i]
                newMemberArr.push(member);
            }
            grpObj.memberList = newMemberArr


            let result = await grpObj.promise.save()
            let filteredGroups = await getFilteredGroups(req.user.email)

            if (memberList && memberList.length > 0 && (oldmemberList == null || (oldmemberList.toString() != memberList.toString()))) {
                console.log('Sending emails');
                transporter.sendMail({
                    from: createdBy,
                    to: memberList,
                    subject: 'Share Magic Moments',
                    text: "Copy and paste this URL in your browser to start viewing " + req.user.fullname + "'s moments : http://localhost:8000/"
                });
            }

            res.render('pages/manage-groups.ejs', {
                user: req.user,
                groups: filteredGroups,
                message: req.flash('error'),
                verb: req.user.fullname
            })
        }

    }))

    app.get('/group/count/reset', isLoggedIn, then(async(req, res)=> {
        console.log('I am here')
        let groupId = req.query.groupId;
        let group = await Group.promise.findById(groupId)
        if (group) {
            if (group.memberList && group.memberList.length > 0) {
                for (var cnt = 0; cnt < group.memberList.length; cnt++) {
                    if (group.memberList[cnt].email === req.user.email) {
                        group.memberList[cnt].viewed = true;
                        await group.promise.save();
                        break
                    }
                }
            }
        }
        res.json({})
    }))
}
