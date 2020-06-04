const express = require('express');
const User = require('../core/user');
const router = express.Router();
const con = require('../core/pool');
const hash = require('bcrypt');


const user = new User();


//Helper function that deletes the posts of a given user
function deletePosts(UserID) {
    //Have to delete all posts and comments by the user first or it'll crash
    let sql = 'select * from posts where UserID = ?';
    con.query(sql, UserID, (err, result) =>{
        if(err) throw err;
        if(result)
        {
            //remove comments attatched to posts
            let sql2 = 'delete from comments where PostID = ?'
            
            result.forEach(function(post)
            {
                var alsotest = con.query(sql2, post.PostID, (err, results) => {
                    if(err) throw err;
                    return(results);
                })
            })

            //now remove the posts themselves
            let sql3 = 'delete from posts where PostID = ?'
            result.forEach(function(post)
            {
                var test = con.query(sql3, post.PostID, (err, results) => {
                    if(err) throw err;
                    return(results)
                })
            })    
        }

        //Now delete all comments made by the user
        let sql4 = 'delete from comments where UserID = ?'
        con.query(sql4, UserID, (err, result) => {
            if(err) throw err;
        })

        //Callback
        return(1)
    })
}

//*********************************************Nguyen section**************************************************//
router.post('/do-comment',(req,res)=>{
    if(req.session &&req.session.user.UserID){
        var UserID = req.session.user.UserID
        var CommentContent = req.body.addComment
        var TimeOfComment= new Date()
        var PostID = req.body.PostID
        sql = 'INSERT INTO comments (UserID, PostID, CommentContent, TimeOfComment) VALUES ( ?, ?, ?, ?)';
        data = [UserID, PostID, CommentContent, TimeOfComment];
    
         con.query(sql, data, (err, result) => {
             if(err) throw err;
             //SUccess
             res.redirect('/comment/'+PostID)
         })
    }else{
        res.redirect("/");
    }

    //req.session.user.UserID
})
router.get('/GroupPost',(req,res)=>{
    if(req.session && req.session.user){
            user.getPosts(req.session.user.GroupID,(result)=>{
                if(result.length>0)
                {
                    result.reverse()
                    res.render("home-form",{posts:result, user:req.session.user})
                }
                else{
                    let sql = 'select * from Groupp inner join accounts on Groupp.GroupID = accounts.GroupID where Groupp.GroupID = ?'
                    con.query(sql, req.session.user.GroupID, function (error, results, fields) {
                        if (error) throw error;
                        result.reverse()
                        res.render("home-form",{posts:results, user:req.session.user})
                })
            }
                
            })
    }else
    {
        res.redirect('/');
    }
})

//Have to eliminate url params or images don't render for unknown reasons
router.get('/comment/:id',(req,res)=>{
    req.session.commentid=req.params.id

    let mysqldata = req.session.user.UserID
    let mysql = `select GroupID from accounts where UserID=?`

    con.query(mysql, mysqldata, (err, groupid) => {
        req.session.user.GroupID = groupid[0].GroupID
    })

    res.redirect('/displaycomment');
    
})

router.get('/displaycomment', (req,res)=>{
    
    let mysqldata = req.session.user.UserID
    let mysql = `select GroupID from accounts where UserID=?`

    con.query(mysql, mysqldata, (err, groupid) => {
        req.session.user.GroupID = groupid[0].GroupID
    })

    let sql = 'select * from posts inner join (accounts cross join comments) on (posts.PostID = comments.PostID and accounts.UserID = comments.UserID) where posts.PostID = ?'
    let postsql = 'select * from posts inner join accounts on posts.UserID = accounts.UserID where posts.PostID = ?'
    if(req.session.commentid == null)
    {
        res.redirect('/group');
    }
    //Used to retrieve the profile picture of the original post before the comments. Inefficient but I'm on a deadline
    con.query(postsql, req.session.commentid, function (error, result, fields){
        con.query(sql, req.session.commentid, function (error, results, fields) {
            if (error) throw error;
            if(results.length>0){
                res.render("partials/comment",{posts:results, original:result})
           }
           else{
                let sql = 'select *from posts where PostID=?'
                con.query(sql, req.session.commentid, function (error, results, fields) {
                if (error) throw error;
                res.render("partials/comment",{posts:results, original:result})
               })
           }
          
       })
    })
    
})
router.post('/submitpost',(req,res)=>{
    if(req.session && req.session.user.UserID){
        var UserID = req.session.user.UserID
        var GroupID = req.session.user.GroupID
        var PostContent = req.body.addComment
        var TimeOfComment= new Date()
        var FullName = req.session.user.FirstName +' '+ req.session.user.LastName
        sql = "INSERT INTO posts (UserID, PostContent,FullName, TimeOffPost) VALUES ( ?, ?, ?,?)";
        data = [UserID, PostContent,FullName,TimeOfComment];
         con.query(sql, data, (err, result) => {
             if(err) throw err;
    
             //SUccess
             
             res.redirect("/GroupPost");
         })
    }else{
        res.redirect("/");
    }

})
//*****************************************************End Nguyen section ************/

// Index Page
router.get('/', function(req, res){
    let user = req.session.user;
    if (user) {
        res.redirect('/home');
        return;
    }
    res.render('index', {title:"My application"});
});
 
// Get home page
router.get('/home', (req, res, next)=>{
    let user = req.session.user;

    let mysqldata = req.session.user.UserID
    let mysql = `select GroupID from accounts where UserID=?`

    con.query(mysql, mysqldata, (err, groupid) => {
        req.session.user.GroupID = groupid[0].GroupID
    })

    if(user){
        res.redirect(`/GroupPost`)
        return;
    }
    res.redirect('/');
});

// Post Login Data
router.post('/login', (req, res, next)=> {
    user.login(req.body.username, req.body.password, function(result){
        if(result) {
            req.session.user = result;
            req.session.opp = 1;
            if(req.session.user.AdministratorFlag != null){
                res.redirect('/adminpage')
            }
            else if(req.session.user.GroupID == null)
            {
                res.redirect('/regroup');
            }
            else{
                req.flash('Logged in as :'+result.username);
                res.redirect('/home');
            }

            
        } else {
            req.flash('Username/Password is incorrect!');
            res.redirect('/');
        }
    })
});

// Joins the user to a different group
router.get('/regroup', (req, res, next) => {

    //If there is no user redirect them
    if(req.session.user == null) {
        res.redirect('/');
    }
    //If they have a group, redirect them
    else if(req.session.user.GroupID != null){
        res.redirect('/');
    }
    //Otherwise, render the group page
    else {
        res.render('add_group');
    }
    
});

//Attempting to join a group in a category
router.post('/regroup', (req, res, next) => {
     //If there is no user redirect them
     if(req.session.user == null) {
        res.redirect('/');
    }
    //If they have a group, redirect them
    else if(req.session.user.GroupID != null || req.session.user.UserID == null){
        res.redirect('/');
    }
    
    
    //Yes, there are several better ways to do this, but I'm in a rush.
    //Make sure the submission matches a legitimate category
    let Category = JSON.stringify(req.body.group);
    Category = Category.substring(1, Category.length - 1)

    if(Category.valueOf() === "Xbox" || Category.valueOf() === "Nintendo" || Category.valueOf() === "Playstation" ||
    Category.valueOf() === "PC Gaming" || Category.valueOf() === "Reading" || Category.valueOf() === "Movies" 
    || Category.valueOf() === "Chemistry" || Category.valueOf() === "Motorsports" || Category.valueOf() === "Golf" 
    || Category.valueOf() === "Golf" || Category.valueOf() === "Football" || Category.valueOf() === "Soccer" 
    || Category.valueOf() === "Baseball" || Category.valueOf() === "Cooking" || Category.valueOf() === "Camping"
    || Category.valueOf() === "Fitness" || Category.valueOf() === "Uncategorized")
    {
        let GroupType = req.body.group;
        let UserID = req.session.user.UserID

        //Find if there are already any groups of this category
        let sql = "SELECT * from Groupp WHERE GroupCategory = ? AND NumberOfPeopleInGroup < 10";
        let data = [GroupType];


        con.query(sql, data, (err, result) => {
                if(err) throw err;
                //If there is no such group, create one
                if(result.length == 0)
                {
                    sql = "INSERT INTO Groupp (GroupCategory, NumberOfPeopleInGroup) VALUES (?,?)"
                    let data = [GroupType, 1];

                    con.query(sql, data, (err, result) => {
                        if(err) throw err;

                        //Now, get the new GroupID
                        result = null;
                        sql = "SELECT GroupID from Groupp WHERE GroupCategory = ? AND NumberOfPeopleInGroup < 10";
                        data = [GroupType];
                        con.query(sql, data, (err, result)=>
                        {
                            if(err) throw err;
                            
                            //If we can't find the group now, we really blew it
                            if(result.length == 0) throw "Something has gone very wrong";
                            

                            //Doesn't work without it. Reasons unknown
                            result = JSON.stringify(result[0]);
                            result = JSON.parse(result);

                            let new_group_id = result.GroupID;
                            

                            //Now, put the user in the new group
                            sql = "UPDATE accounts SET GroupID = ? WHERE UserID = ?";
                            data = [new_group_id, UserID];
                            con.query(sql, data, (err, result)=>
                            {
                                if(err) throw err;

                                req.session.user.GroupID = new_group_id
                                //Send them to their new group
                                res.redirect('/home');
                            })
                        })
                    })
                }
                //Add them to one of the groups
                else
                {
                    //Pick out a random group from among the available ones
                    NewGroup = Math.floor(Math.random() * result.length);
                    
                    //Doesn't work without it. Reasons unknown
                    result = JSON.stringify(result[NewGroup]);
                    result = JSON.parse(result);

                    NewGroupID = result['GroupID'];
                    sql = "UPDATE accounts SET GroupID = ? WHERE UserID = ?";
                    data = [NewGroupID, UserID];
                    
                    con.query(sql, data, (err, result) =>
                    {
                        if(err) throw err;
                        sql = "UPDATE Groupp SET NumberOfPeopleInGroup = NumberOfPeopleInGroup + 1 WHERE GroupId = ?";
                        data = [NewGroupID];
                        con.query(sql, data, (err, result) => {
                            if(err) throw err;

                            req.session.user.GroupID = NewGroupID

                            //This means we have successfully been added to the group
                            res.redirect('/home');
                        })
                    })
                }
            })
        }
    else{
        res.redirect('/');
    }
});

// Log Out Button
router.get('/logout', (req, res, next) => {
    if(req.session.user) {
        req.session.destroy(function(){
            res.redirect('/');
        });
    }
});

//Registration
router.post("/register", (req, res) => {
    var first_name = req.body.register_first_name;
    var last_name = req.body.register_last_name;
    //Username is actually email. Long story.
    var email = req.body.username;
    var password = hash.hashSync(req.body.password, 10);

    //Make sure they filled in all the fields
    if(first_name == null || email == null || password == null || last_name == null)
    {
        req.flash("Not all fields provided");
        req.redirect('/');
    }

    //Ensure nobody has used this email before
    let sql = "SELECT * from accounts WHERE Email = ?";
    let data = [email];


    con.query(sql, data, (err, result) => {
        if(err) throw err;

        if(result.length > 0)
        {
            req.flash("Email has already been used");
            res.redirect('/');
        }
        else
        {
            //Insert the user into the database
            sql = "INSERT INTO accounts (FirstName, LastName, Email, Passwd) VALUES (?, ?, ?, ?)";
            data = [first_name, last_name, email, password];

            con.query(sql, data, (err, result) => {
                if(err) throw err;

                //REGISTRATION SUCCESSFUL
                res.redirect(307, "login");
            })
        }
    

    })    
})

//profile
router.get("/profile", (req, res) => {
    
    con.query(`select * from accounts where UserID=${req.session.user.UserID}`, (err,result) => {
        if(err) throw err;
        res.render('profile', {r : result, boo:true} );
    })
    })

//other profile
//I know what you're thinking: This looks jenky
//It is. But it works.
router.get("/user/:userID", (req, res) => {
    req.session.ProfileUser = req.params.userID;
    res.redirect('/userprofile');
})
router.get("/userprofile", (req, res) => {
    if(req.session.ProfileUser == null)
    {
        res.redirect('/group');
    }
    if(req.session && req.session.user){
        //sql to get info for the other user
        con.query(`SELECT FirstName, LastName, Bio, Email, ProfilePicture, UserID from accounts where UserID=${req.session.ProfileUser}`, (err,result) => {

            //variables to check if they have voted
            var voter = req.session.user.UserID
            var victim = req.session.ProfileUser

            //sql to check whether the current user has voted for the other user
            con.query(`SELECT VoterID, VictimID FROM votes where VoterID = ${voter} && VictimID = ${victim}`, (err, sqlresult)=>{
                
                //if there is no result, then the current user has not voted for them and voted is set to false when loading profile
                if(sqlresult[0] === undefined){
                    res.render('profile', {r : result, boo:false, voted : false})
                    
                //else means that there was a result from sql, which means the current user has voted for them and voted is set to true
                }else{
                    res.render('profile', {r : result, boo:false, voted : true} )
                }
            })
        })
    }else
    {
        res.redirect('/');
    }
})

router.get('/group',(req,res)=>{
    if(req.session && req.session.user){
        let mysqldata = req.session.user.UserID
        let mysql = `select GroupID from accounts where UserID=?`

        con.query(mysql, mysqldata, (err, groupid) => {
        req.session.user.GroupID = groupid[0].GroupID
        })

        sql = `SELECT GroupID from accounts WHERE UserID = ${req.session.user.UserID}`;
        con.query(sql, (err, result)=>{
            if(err) throw err;
            
    
            sql = `SELECT FirstName, LastName, Bio, ProfilePicture, UserID from accounts WHERE GroupID = ${result[0].GroupID} and UserID <> ${req.session.user.UserID}`;
            con.query(sql, (err, result2)=>{
            
            res.render('group', {users : result2, numMembers : result2.length})
    
            })
        
            })}else{
                res.redirect('/');
            }
})


//edit profile page
router.get("/editprofile", (req, res) => {
    con.query(`select * from accounts where UserID=${req.session.user.UserID}`, (err,result) => {
        if(err) throw err;
        res.render('editprofile', {firstName : result[0].FirstName, lastName : result[0].LastName,
            email : result[0].Email, bio : result[0].Bio, pfp : result[0].ProfilePicture} );
    })
})

//update profile
router.post("/updateprofile", (req, res) => {

    /*prepared sql statement
    gets data from parser and saves it for sql statement in variable data
    executes prepared sql statement*/
    let sql = `update accounts set FirstName = ?, LastName=?, Email=?, Bio=? where UserID=${req.session.user.UserID};`
    let data = [req.body.fName, req.body.lName, req.body.email, req.body.bio]
    con.query(sql, data, (err,result) => {
        if(err) throw err;
        res.redirect('/profile');
    })
})

//settings
router.get("/settings", (req, res) => {
        res.render('settings')
    })

//account deleted
router.get("/deletedaccount", (req, res) => {

    if(!req.session.user)
    {
        res.redirect('/');
    }

    //Have to delete all posts and comments by the user first or it'll crash
    let sql = 'select * from posts where UserID = ?';
    con.query(sql, req.session.user.UserID, (err, result) =>{
        if(err) throw err;
        if(result)
        {
            //remove comments attatched to posts
            let sql2 = 'delete from comments where PostID = ?'
            result.forEach(function(post)
            {
                var alsotest = con.query(sql2, post.PostID, (err, results) => {
                    if(err) throw err;
                    callback(results);
                })
            })

            //now remove the posts themselves
            let sql3 = 'delete from posts where PostID = ?'
            result.forEach(function(post)
            {
                var test = con.query(sql3, post.PostID, (err, results) => {
                    if(err) throw err;
                    callback(results)
                })
            })

            
        }

        //Now delete all comments made by the user
        let sql4 = 'delete from comments where UserID = ?'
        con.query(sql4, req.session.user.UserID, (err, result) => {
                if(err) throw err;
            
            //retrieves all the users the user has voted for
            con.query(`select VictimID from votes where VoterID= ?`,req.session.user.UserID, (err, votedusers) => {

                //if the sql statement equals undefined then the user did not vote for anyone
                if(votedusers != undefined){
                    //creates array for all the people the user voted for
                    var votedusersarr = []

                    //for loop to add all the voted users to the array
                    for(var i=0; i<votedusers.length; i++){
                        votedusersarr.push(votedusers[i].VictimID)
                    }
                    
                //else statement so the sql doesnt give error for undefined array(the array would be empty if they didnt vote for anyone)
                }else{
                    votedusersarr.push(-1)
                }

                //converts the array to a string and removes the brackets
                var array = votedusersarr.toString().replace('[','').replace(']','')
                

                //deletes all of the votes for and from the user
                con.query(`delete from votes where VictimID=${req.session.user.UserID} or VoterID=${req.session.user.UserID}`, (err, result) => {
                    
                    //decrements the votes for all users that the user has voter for
                    con.query(`update accounts set NumVotes=NumVotes-1 where UserID IN (${array})`, (err, result) => {

                        //Now that the posts and comments are deleted, delete the account
                        con.query(`delete from accounts where UserID=${req.session.user.UserID}`, (err,result) => {
                            if(err) throw err;
                            con.query(`UPDATE Groupp set NumberOfPeopleInGroup = NumberOfPeopleInGroup - 1 where GroupID = ${req.session.user.GroupID}`, (err, result) => {
                                req.session.destroy(function(){
                                res.redirect('/');
                            })
            });
        })
                         
                    })                                         
                })
            })
            
        
        })
    }) 
})

//Change/Leave Group
router.get('/changegroup', (req, res) => {
    let id = req.session.user.UserID;
    con.query('UPDATE Groupp set NumberOfPeopleInGroup = NumberOfPeopleInGroup - 1 where GroupID = (SELECT GroupID FROM accounts WHERE UserID = ?)', id, (err, result) => {
        if (err) throw err;
        con.query('UPDATE accounts set GroupID = Null WHERE UserID = ?', id, (err, result) => {
            if (err) throw err;


            var delposts = deletePosts(id);

            //retrieves all the users the user has voted for
            con.query(`select VictimID from votes where VoterID= ?`,req.session.user.UserID, (err, votedusers) => {

                //if the sql statement equals undefined then the user did not vote for anyone
                if(votedusers != undefined){
                    //creates array for all the people the user voted for
                    var votedusersarr = []

                    //for loop to add all the voted users to the array
                    for(var i=0; i<votedusers.length; i++){
                        votedusersarr.push(votedusers[i].VictimID)
                    }
                    
                    //else statement so the sql doesnt give error for undefined array(the array would be empty if they didnt vote for anyone)
                    }else{
                        votedusersarr.push(-1)
                    }

                    //converts the array to a string and removes the brackets
                    var array = votedusersarr.toString().replace('[','').replace(']','')
                

                    //deletes all of the votes for and from the user
                    con.query(`delete from votes where VictimID=${req.session.user.UserID} or VoterID=${req.session.user.UserID}`, (err, result) => {
                    
                        //decrements the votes for all users that the user has voter for
                        con.query(`update accounts set NumVotes=NumVotes-1 where UserID IN (${array})`, (err, result) => {

                        
                            });
                        })
                         
                    })                                         
                })
            })
            req.session.user.GroupID = null
            res.redirect("/regroup");          
        });

//Delete Post with comments
router.get('/deletepost/:eventID', (req, res) => {
    let sql = 'DELETE FROM comments where PostID = ?';
    let data = [req.params.eventID];
    con.query(sql, data, (err, result) => {
        if (err) throw err;
        sql = 'DELETE FROM posts where PostID = ? and UserID = ?';
        data = [req.params.eventID, req.session.user.UserID];
        con.query(sql, data, (err, result) => {
            if (err) console.log(err);
            res.redirect("/GroupPost");
        });
    });
});

//stuff for profile pictures
const multer = require('multer')
router.use(express.static('./public'))
const path = require('path')

const storage = multer.diskStorage({
    //renames the images and stores them in the public folder
    destination: './public',
    filename: function(req, file, cb){
        cb(null,file.fieldname + '-' + Date.now()+ path.extname(file.originalname))
    }
})
const upload = multer({
    storage: storage
}).single('img');

//new pfp
router.post("/newpfp", (req, res) => {
    upload(req, res, (err)=>{
        //sql to change the pfp
        let sql = `update accounts set ProfilePicture = ? where UserID=${req.session.user.UserID};`
        let data = [req.file.filename]
        con.query(sql, data, (err,result) => {
        if(err) throw err;

        //redirects to profile page
        res.redirect('/profile');
    })
    })
    })

    router.get('/admingroup/:groupID',(req,res)=>{
        if(req.session && req.session.user){ 
            sql = `SELECT FirstName, LastName, Bio, ProfilePicture, UserID from accounts WHERE GroupID = ${req.params.groupID} and UserID <> ${req.session.user.UserID}`;
                con.query(sql, (err, result2)=>{
                res.render('group', {users: result2, numMembers: result2.length})
                    
                })
                        
        }else{
            res.redirect('/');
        }
    })
    
    
    
    
    router.get("/adminpage", (req, res) => {
        if(req.session && req.session.user){
                sql = `select distinct GroupID, GroupCategory from Groupp where GroupID is not null`;
                con.query(sql, (err, result)=>{
                res.render('adminpage', {group: result})
                })
        }else
        {
            res.redirect('/');
        }
        })

//voteout route
//i am sure there is a much better and more efficient way, but we are low on time
router.get("/voteout/:userid", (req, res) => {

    if(req.session && req.session.user){
    
        //creates variables for the victimid, voterid, and groupid
        var victim = req.params.userid
        var voter = req.session.user.UserID
        var group = req.session.user.GroupID
    
        data = [victim, voter, group]

                //insert the vote into the votes table
                sql = `INSERT INTO votes (VictimID, VoterID, GroupID) VALUES (?, ?, ?);`;
                con.query(sql, data, (err, result)=>{
                    
                    //increment the number of votes 
                    sql = `UPDATE accounts SET NumVotes = NumVotes + 1 WHERE UserID = ${victim}`
                    con.query(sql, (err, result2)=>{

                        //get the number of votes
                        sql = `select NumVotes from accounts where UserID=${victim}`
                        con.query(sql, (err, numvotes)=>{

                            //get the number of members in the group
                            sql = `SELECT NumberOfPeopleInGroup FROM Groupp where GroupID=${group};`
                            con.query(sql, (err, members)=>{

                                //if statement that checks if a person has enough votes to be removed from the group
                                if(numvotes[0].NumVotes>= (members[0].NumberOfPeopleInGroup/2)){
                                    //the user has enough votes to get kicked.
                                    console.log("this person has enough votes to get kicked out")
                                    var delTheirPosts = deletePosts(victim);
                                    //decrements the number of users in the group
                                    con.query(`UPDATE Groupp set NumberOfPeopleInGroup = NumberOfPeopleInGroup - 1 where GroupID = ${group}`, (err, result) => {

                                        //sets the victim's groupid to null
                                        con.query(`UPDATE accounts set GroupID = Null WHERE UserID = ${victim}`, (err, result) => {

                                            //sets the user's votes back to 0
                                            con.query(`UPDATE accounts set NumVotes = 0 WHERE UserID = ${victim}`, (err, result) => {

                                                //retrieves all the users the victim has voted for
                                                con.query(`select VictimID from votes where VoterID=${victim}`, (err, votedusers) => {

                                                    //if the sql statement equals undefined then the user did not vote for anyone
                                                    if(votedusers != undefined){
                                                        //creates array for all the people the user voted for
                                                        var votedusersarr = []

                                                        //for loop to add all the voted users to the array
                                                        for(var i=0; i<votedusers.length; i++){
                                                            votedusersarr.push(votedusers[i].VictimID)
                                                        }
                                                        
                                                    //else statement so the sql doesnt give error for undefined array(the array would be empty if they didnt vote for anyone)
                                                    }else{
                                                        votedusersarr.push(-1)
                                                    }

                                                    //converts the array to a string and removes the brackets
                                                    var array = votedusersarr.toString().replace('[','').replace(']','')
                                                    

                                                    //deletes all of the votes for and from the victim
                                                    con.query(`delete from votes where VictimID=${victim} or VoterID=${victim}`, (err, result) => {
                                                        
                                                        //decrements the votes for all users that the victim has voter for
                                                        con.query(`update accounts set NumVotes=NumVotes-1 where UserID IN (${array})`, (err, result) => {
                                                             
                                                        })                                         
                                                    })
                                                })
                                            })

                                        })
                                    })

                                }
                                res.redirect('/group')
                            })

                        })

                    })
            })

    }else{
    res.redirect('/');
    }
})

//unvote for someone
router.get("/rescindvote", (req, res) => {

    //saves victimid, voterid and groupid
    var victim = req.session.ProfileUser
    var voter = req.session.user.UserID
    var group = req.session.user.GroupID
    data = [victim, voter, group]

    //deletes vote from the votes table
    sql = `delete FROM votes where VictimId=${victim} and VoterID=${voter} and GroupID=${group}`;
    con.query(sql, data, (err, result)=>{
    
        //decrements the vote for the user in the accounts table
        sql = `UPDATE accounts SET NumVotes = NumVotes - 1 WHERE UserID = ${victim}`
            con.query(sql, (err, result2)=>{
                res.redirect('/userprofile')

                })
            })

})






module.exports = router;
