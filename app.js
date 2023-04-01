require("dotenv").config();
var express = require("express");
var app = express();
var path = require("path");
var hbs = require("hbs");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var mongoose = require("mongoose");
var users;
console.log(process.env.REACT_APP_GOOGLE_CLIENT_ID);
mongoose.connect("mongodb://localhost:27017/keepdata");
var userschema = new mongoose.Schema({
  titl: String,
  text: String,
});
var schema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  token: String,
  data: {
    type: [userschema],
  },
});
var model = new mongoose.model("keep", schema);
var usermodel = new mongoose.model("usersc", userschema);
hbs.registerPartials(path.join(__dirname, "partials"));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "hbs");
app.use(express.static("public"));
app.get("/", async (req, res) => {
  res.render("form", { code: "valid", src: "images/yellow.png" });
  //res.render("app");
  //var x= await model.deleteMany(); //for deleting all data in collections
  //console.log(x);
});
app.get("/saveddata", async (req, res) => {
  console.log(users.data);
  res.render("savedfiles", { result: users.data });
});
app.post("/save", async (req, res) => {
  let data = req.body;
  console.log(req.body._id);
  newdata = users.data.filter((u) => {
    if (u._id != req.body._id) {
      return u;
    }
  });
  users.data = newdata;
  var z = await model.findOneAndUpdate(
    { username: users.username },
    { data: newdata }
  );
  users = await model.findOne({ username: users.username });
  res.render("savedfiles", { result: newdata });
});
app.get("/addingdata", (req, res) => {
  res.render("app");
});
app.post("/addingdata", async (req, res) => {
  let prev = users.data;
  let newd = new usermodel({
    titl: req.body.title,
    text: req.body.text,
  });
  prev.push(newd);
  var a = await model.findOneAndUpdate(users._id, { data: prev });
  res.render("app");
});
app.get("/newaccount", async (req, res) => {
  res.render("registration", { visib: "hidden" });
});
app.post("/newaccount", async (req, res) => {
  try {
    var passhash = await bcrypt.hash(req.body.pass, 10);
    var m = new model({
      username: req.body.username,
      password: passhash,
    });
    var t = await m.save();
    var x = await model.findOne({ username: req.body.username });
    console.log(x);
    var token = await jwt.sign(
      { _id: x._id.toString() },
      process.env.SECRETKEY
    );
    console.log(token);
    var p = await model.findOneAndUpdate(x._id, { token: token });
    res.cookie("JWT", token, { expires: new Date(Date.now() + 300000) });
    res.redirect("/");
  } catch (error) {
    res.render("registration", { code: "user already exist",src: "images/yellow.png" },);
  }
});
app.post("/", async (req, res) => {
  var x = await model.findOne({ username: req.body.username });
  users = x;

  if (x) {
    var f = await bcrypt.compare(req.body.pass, x.password);
    if (f) {
      var token = await jwt.sign(
        { _id: x._id.toString() },
        process.env.SECRETKEY
      );
      console.log(token);
      res.cookie("JWT", token, { expires: new Date(Date.now() + 300000) }); //it create a cookie named JWT having value token
      /*res.cookie('JWT',token,{
                expires: new (date.now()+ 30000), //will expire after 30 seconds
                httpOnly:true, // cookie value cannot be changed 
                secure:true
            })
            */
      res.redirect("/addingdata");
    } else {
      res.render("form", {
        code: "<script>  alert('invalid details') </script>",
        visib: "hidden",
      });
    }
  } else {
    res.render("form", { code: "account not found", visib: "hidden" ,src: "images/yellow.png"});
  }
  /*model.findOne({username:req.body.username},async(err)=>{
        if(!err){
            res.render("app")
        }
        else{
            var x= await model.save({
            username:req.body.username,
            password: req.body.pass,
            })
        }
    });*/
});

app.listen(7000, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("working properly");
  }
});
