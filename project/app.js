const express = require('express')
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const upload = require("./config/multerconfig");
const path = require("path");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));

app.get("/",(req, res)=>{
  res.render("index");
})
app.get("/profile/upload", (req, res)=>{
  res.render("profileupload");
})

app.post("/upload", isLoggedIn,upload.single("image"), async(req, res)=>{
  let user = await userModel.findOne({email: req.user.email});
  user.profilepic = req.file.filename;
  //kyuki hmne khud hath se change kiya hai isiliye user.save
  await user.save();
  res.redirect("/profile");
})
// ,upload.single("image")
// app.post("/upload",(req, res)=>{
//   console.log("Body:", JSON.stringify(req.body, null, 2)); // Log the body
//     console.log("File:", req.file); // Log the file information

//   if (req.file) {
//     res.send("File uploaded successfully!");
// } else {
//     res.send("No file uploaded.");
// }
// })
app.get("/profile", isLoggedIn, async (req, res)=>{
  let user = await userModel.findOne({email : req.user.email}).populate("post")
  // toh hm post field ko populate kr rhe hai
  res.render("profile",{user});
})
app.get("/like/:id", isLoggedIn, async (req, res)=>{
  let post = await postModel.findOne({_id: req.params.id}).populate("user");
  //like and unlike k liye functionality
  if (post.likes.indexOf(req.user.userId) === -1){
    post.likes.push(req.user.userId)
  }
  else{
    post.likes.splice(post.likes.indexOf(req.user.userId),1);
  }
  await post.save()
  res.redirect("/profile");
})
app.get("/edit/:id", isLoggedIn, async (req, res)=>{
  let post = await postModel.findOne({_id: req.params.id})
  res.render("edit",{post});
  
})
app.post("/update/:id", isLoggedIn, async (req, res)=>{
  let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content : req.body.content})
  res.redirect("/profile");
})
app.post("/post", isLoggedIn, async (req, res)=>{
  let user = await userModel.findOne({email : req.user.email})
  let {content} = req.body;
  let post = await postModel.create({
    user: user._id,
    content,
  });
  // so hme user ko batayengee ki usne post create krdi hai isiliye user ki posts me post id push kr denge
  user.post.push(post._id);
  await user.save();
  res.redirect("/profile");
})
app.get("/login", (req, res)=>{
  res.render("login");
})
app.post("/register", async(req, res)=>{
  let {name, username, password, email, age} = req.body;
  let user = await userModel.findOne({email});
  if(user) return res.status(500).send("User already registered");

  bcrypt.genSalt(10, (err ,salt)=>{
    bcrypt.hash(password, salt, async(err, hash)=>{
      let user = await userModel.create({
        name,
        username,
        password: hash,
        email,
        age,

    })
   let token = jwt.sign({email: email, userId: user._id}, "secret")
   res.cookie("token", token);
   res.send("registered");
  })
  })
})
app.post("/login", async(req, res)=>{
  let {email, password} = req.body;
  let user = await userModel.findOne({email});
  if(!user) return res.status(500).send("Something went wrong");

  bcrypt.compare(password, user.password, function(err, result){
    if(result){ 
      let token = jwt.sign({email: email, userId : user._id}, "secret")
      res.cookie("token", token);
      res.status(200).redirect("/profile")
     }
   else res.redirect("/login");

  })
  })

app.get("/logout", (req, res)=>{
  res.cookie("token","");
  res.redirect("/login");
})

// middleware for protected routes
//like yeh check krega ki user loggedin hai ki ni ager loggedin hoga tabhi woh profile open kr skta hai
function isLoggedIn(req, res, next){
  if(req.cookies.token === "") res.send("You must be logged in");
  else{
    let data = jwt.verify(req.cookies.token, "secret");
    req.user = data;
    next();
  }
}
app.listen(3000);