/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const { Admin } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("manaswini_s_online_voting_app_27", ["POST", "PUT", "DELETE"]));

const path = require("path");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

const saltRounds = 10;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));
app.use(flash());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "my-super-secret-key-27282069152514",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, //24 hrs
    },
    resave: true,
    saveUninitialized: true,
  })
);
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());


passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      (username, password, done) => {
        Admin.findOne({ where: { email: username } })
          .then(async (admin) => {
            const result = await bcrypt.compare(password, admin.password);
            if (result) {
              return done(null, admin);
            } else {
              return done(null, false, { message: "Invalid password" });
            }
          })
          .catch(() => {
            return done(null, false, { message: "Invalid Email-ID or Password" });
          });
      }
    )
  );
  passport.serializeUser((admin, done) => {
    console.log("Serializing user in session", admin.id);
    done(null, admin.id);
  });
  
  passport.deserializeUser((id, done) => {
    Admin.findByPk(id)
      .then((admin) => {
        done(null, admin);
      })
      .catch((error) => {
        done(error, null);
      });
  });


  app.get("/signup", (request , response) => {
    response.render("adminsignup" , {
        title: "Sign Up",
        csrfToken: request.csrfToken(),
    });
  });

  app.post("/admins", async (request , response) => {
    //we are using hashedpw to encrypt
    if(!request.body.firstName) {
        request.flash("error" , "Please enter first name");
        return response.redirect("/signup");
    }
    if(!request.body.email) {
        request.flash("error","Please enter email");
        return response.redirect("/signup");
    }
    if(!request.body.password) {
        request.flash("error","please enter password");
        return response.redirect("/signup");
    }

    const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
    console.log(hashedPwd);
  // have to create the admin here
  try {
    const admin = await Admin.createAdmin({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(admin, (err) => {
      if (err) {
        console.log(err);
        response.redirect("/");
      } else {
        response.redirect("/");
      }
    });
  } catch (error) {
    console.log(error);
    request.flash("error", "email already registered");
    return response.redirect("/signup");
  }
});

app.get("/adminlogin", (request, response) => {
    response.render("login", { title: "Admin Login", csrfToken: request.csrfToken() });
});

app.get("/signout", (request, response, next) => {
    //Signout
    request.logout((err) => {
      if (err) {
        return next(err);
      }
      response.redirect("/");
    });
  });
  
  app.get("/", async (request, response) => {
    response.render("index", {
      title: "Online Election Application",
      csrfToken: request.csrfToken(),
    });
  });
  
  app.post(
    "/session",
    passport.authenticate("local", {
      failureRedirect: "/adminlogin",
      failureFlash: true,
    }),
    (request, response) => {
      response.redirect("/");
    }
  );

    app.get("/elections" , connectEnsureLogin.ensureLoggedIn() , aysnc())




module.exports = app;