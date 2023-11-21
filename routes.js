const passport=require('passport');
const userData=require('./models/userData');
const eventData=require('./models/event');
const firebase=require('firebase/app')
const multer=require('multer');
const path=require('path')

const { getStorage, ref, uploadBytesResumable,getDownloadURL } = require("firebase/storage");

const validator=require('validator')
const firebaseConfig = {
    apiKey: "AIzaSyDkTVL_FS17diZVH852oQRG-dB__o6Lnzw",
    authDomain: "care-club-4b0b6.firebaseapp.com",
    projectId: "care-club-4b0b6",
    storageBucket: "care-club-4b0b6.appspot.com",
    messagingSenderId: "1059626952989",
    appId: "1:1059626952989:web:1b186213e3a8e73cf599f4",


  }; 
  firebase.initializeApp(firebaseConfig);
  const storage = getStorage();
  
  const upload = multer({ storage: multer.memoryStorage() });
  
  
const updateDetails=require('./controllers/Details');
const eventDetails=require('./controllers/event')
function routes(app){
app.get('/details',(req,res)=>updateDetails.getDetailsFile(req,res)); //rendring detail ejs file
app.post('/details',updateDetails.addDetails(userData))//handelin detail
app.get('/get-event',(req,res)=>eventDetails.getEventFile(req,res));//rendring event ejs file 
app.post('/create-event',upload.single("e_image"),eventDetails.createEvent(eventData,storage))//handeling event
app.get('/events',(req,res)=>eventDetails.getAllEvent(req,res,eventData));//getting all events
app.get('/join-event/:id',(req,res)=>eventDetails.joinEvents(req,res,eventData))
app.get('/joined-events',(req,res)=>eventDetails.getJoinedEventsFile(req,res,eventData))
app.get('/organised-events',(req,res)=>eventDetails.organisedEvents(req,res,eventData))
// app.post('/joined-events',eventDetails.JoinedEvents(eventData))

//written by abishek start here 
app.get('/like',(req,res)=> eventDetails.likeEvent(req,res,eventData));
app.post('/comment/:id',(req,res)=> eventDetails.commentEvent(req,res,eventData));
app.get('/getcomment/:eventId', (req, res) => eventDetails.getComment(req, res, eventData));

//written by abishek end  here 




app.get('/profile',async(req,res)=>{
    console.log("USERRRRRR")
   console.log(req.session.user._id)
   var user=await userData.findOne({_id:req.session.user._id})
   console.log(user)
   var result;
   let tmp=await eventData.find({e_joinies:req.session.user._id})
console.log("________________________")
 console.log(tmp)   
 if(tmp.length > 0){
    result=tmp
 }
 else{
    req.flash("error","You Have Not Joined Any Event")
    result=null
 }
 //joined event close
 var result1;
 let tmp2=await eventData.find({e_org_id:req.session.user._id})
 console.log(tmp2);
 if(tmp2.length >0){
    result1=tmp2;
}else{
     req.flash("error","You Have Not Created Any Event")
     result1=null;
 }//you can even check if result is true or not

    res.render("profile_care",{msg:req.flash(),joinedEvents:result,orgEvents:result1,user:user})
})
app.get('/test',(req,res)=>{
    
   let joined=userData.findOne({})
})
app.get('/auth/google',
  passport.authenticate('google', { scope:[ 'email', 'profile' ] })
);

app.get( '/auth/google/callback',passport.authenticate( 'google',{failureRedirect: '/login/error'}),async(req,res)=>{
    var response=[];
    let user=await userData.findOne({u_email:req.user.email});
    if(user){
        req.flash("error","welcome back user")
            req.session.user=user;

            return res.render("events",{msg:req.flash()}) // Abhishek res.render("AllEvents",{msg:req.flash()})
  }
else{
    let newUser=new userData({

        u_name:req.user.displayName,
        u_email:req.user.email,
        u_password:" ",
        Image_URL:req.user.photos[0].value,
        // u_phone:null,
        G_user:1
    })

    newUser.save().then((result)=>{
        console.log(result)
            
            req.session.user=newUser;
            req.flash("success","Greetings from CareClub")
            return res.render("details",{msg:req.flash()});
       
    }).catch((err)=>{
        console.log(err);
       req.flash("error","can not sign up with google")
        return res.render("login",{msg:req.flash()});  
    }) 
}});  

// https://careclub.onrender.com/auth/google?scope=email
app.get('/click',(req,res)=>{
    console.log("testtt on 102")
    res.send('<a href="https://careclub.onrender.com/auth/google?scope=email"> Sign up with google</a> ')
}) 
// 
app.get('/login',(req,res)=>{
    res.render('login',{msg:req.flash()})
})
app.get('/register',(req,res)=>{
res.render('login',{msg:req.flash()})    
})
app.post('/login', (req,res,next)=>{
    const {email,password}=req.body;
    if(!email || !password){
        req.flash("error","Email and password are required")
        res.render("login",{msg:req.flash()})
        res.redirect('/login',{msg:req.flash()})
    }
  return  next();


}, passport.authenticate('local', {failureRedirect:'/login/error'}),(req,res)=>{
    res.redirect('/login/success');
  });
  app.get('/login/success',async(req,res)=>{
    console.log("heyyyyayduasdhi")
      req.session.user=req.user;
  
        
        return res.redirect("/events")// abhishek 

    
      })
app.get('/login/error',(req,res)=>{
    // let response=[
    //     {

    //         "success":'false',
    //     },{

    //         "msg":"can not login user"
    //     }
    // ]
   
    req.flash("error","Wrong Password or Email")
    res.render("login",{msg:req.flash()})
})
// app.post('/logout', function(req, res, next) {
//     let response=[]
//   req.logout(function(err) {
//     if (err) { return next(err); }
//   delete req.session.user;
//     response.push({
//         "sucess":'true'
//     },{
//         "msg":"logot successfully"
//     })  
//     res.send(response);
//   });
// });

app.post('/register',upload.single("Image_URL"),async(req,res)=>{

    var response=[];
    let u_name=req.body.name
    let u_email = req.body.email;
    let u_password = req.body.password;
    let errors = false;

    if(u_email.length === 0 || u_name === 0 || u_password.length === 0 ) {
        errors='true';
                  // set flash message
                  req.flash("error","Please fill all details")

        return res.render("login",{msg:req.flash()});
    }
    //  
 if (!validator.isEmail(req.body.email)) {
    errors='true';
    req.flash("error","please provide valid email")
    return res.render("login",{msg:req.flash()});
    }
    if (!validator.isStrongPassword(req.body.password)) {
        errors='true';
          req.flash("error","Password must be of 8 characters and it must contain a capital letter, a number and a special character")
    return res.render("login",{msg:req.flash()});
    }
    let oldUser=await userData.findOne({u_email:req.body.email});
    if(oldUser){
        req.flash("error","email already exits")
        return res.render("login",{msg:req.flash()});
        
    }

    // if no error
    if (!errors) {
        var downloadurl
          if(req.file){

              // const hashpw = await bcrypt.hash(req.body.password, 10);
              const storageRef = ref(storage, `files/${+Math.floor((Math.random() * 1000) + 1)+"-"+req.file.originalname}`);
        const metaData={
            contentType:req.file.mimetype,
        };
        uploadBytesResumable(storageRef, req.file.buffer,metaData).then((snapshot) => {
          })
          const snapshot=await uploadBytesResumable(storageRef, req.file.buffer,metaData)
         downloadurl=await getDownloadURL(snapshot.ref);
            }
    else{
        downloadurl=null
    }

        let newUser =new userData ({
            u_name:req.body.name,
            u_email: req.body.email,
            u_password:req.body.password,
            Image_URL:downloadurl,
            // u_phone:null,
            G_user:0

        })
        newUser.save().then((result)=>{
            console.log(result)
            // response.push(
            //     {
            //             "success":"true",
            //     },
            //     {
            //         "data":newUser
            //     },
                
            //     {
            //         "msg":"data inserted successfully using Manual Sign up"
            //     }
            //     )
            req.session.user=req.user;
            
           req.flash("success","registered succesfully please login !!!!")
            return res.redirect('/login')
    
           
        }).catch((err)=>{
            console.log(err);
            req.flash("error",err)
                return res.render('login',{msg:req.flash()});  // abhishek  {res.render('register')}
        })
        // insert query
                }
        
})
}
module.exports=routes