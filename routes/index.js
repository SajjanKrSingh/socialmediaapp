var express = require('express');
var router = express.Router();
const passport = require('passport');
const userModel = require('./users');
const postModel = require('./posts');
const storyModel = require('./story');
const localStrategy = require('passport-local');
const multer = require('multer');
const { v4: uuid } = require('uuid');
const path = require('path');
const { log } = require('console');

passport.use(new localStrategy(userModel.authenticate()));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const fn = uuid()
    cb(null, fn + path.extname(file.originalname));
  }
})

const upload = multer({ storage: storage })

router.get('/', function (req, res) {
  res.render('index', { footer: false });
});

router.get('/login', function (req, res) {
  res.render('login', { footer: false });
});


router.get("/like/:postid", async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const post = await postModel.findOne({ _id: req.params.postid });
  if (post.likes.indexOf(user._id) === -1) {
    post.likes.push(user._id);
  } else {
    post.likes.splice(post.likes.indexOf(user._id), 1);
  }
  await post.save();
  res.json(post);
});

router.get("/save/:postid", isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ username: req.session.passport.user });

  if (user.saved.indexOf(req.params.postid) === -1) {
    user.saved.push(req.params.postid);
  } else {
    var index = user.saved.indexOf(req.params.postid);
    user.saved.splice(index, 1);
  }
  await user.save();
  res.json(user);
});

router.get('/feed', isLoggedIn, async function (req, res) {
  const user=await userModel.findOne({username:req.session.passport.user});
  let posts=await postModel.find().populate('user');
  res.render('feed', { footer: true ,posts,user});
});

router.get('/profile', isLoggedIn,async function (req, res) {
  const loggedInUser = await userModel.findOne({username:req.session.passport.user})
  .populate('posts')
  // console.log(loggedInUser)
  res.render('profile', { footer: true, loggedInUser });
});

router.post('/upload/profilepicture', upload.single('image'), async function (req, res, next) {
  const loggedInUser = req.user
  loggedInUser.profilepicture = req.file.filename;
  await loggedInUser.save();
  res.redirect('/profile');
})

router.get('/search', isLoggedIn, function (req, res) {
  res.render('search', { footer: true });
});


router.get('/searchuser/:username', isLoggedIn, async function (req, res) {
  var val = req.params.username
  var Users = await userModel.find({ username: new RegExp('^' + val, 'i') })
  // console.log(Users);
  res.json(Users);
});


router.get('/edit', isLoggedIn, async function (req, res) {
  var loggedInUser = await userModel.findOne({ username: req.session.passport.user })
  res.render('edit', { footer: true, loggedInUser });
});

router.post('/updateprofile', isLoggedIn, async function (req, res) {
  var loggedInUser = await userModel.findOneAndUpdate(
    { username: req.session.passport.user },
    { username: req.body.username, name: req.body.name, bio: req.body.bio },
    { new: true }        //jab bhi aap login hote ho to username ka ek bahut bada role hota hai login rakhne mein, aur agar aapne username change kiya to aap login to puraane username se they, par ab wo change ho gaya to aap username change hote hi logout ho jaaoge
  );

  req.logIn(loggedInUser, function (err) {
    if (err) throw err;
    res.redirect('/profile')

  })

});

router.get('/upload', isLoggedIn, async function (req, res) {
  var loggedInUser = await userModel.findOne({ username: req.session.passport.user })
  res.render('upload', { footer: true, loggedInUser });
});


router.post('/upload', isLoggedIn, upload.single('image'), async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  const post = await postModel.create({
    caption: req.body.caption,
    image: req.file.filename,
    user: user._id
  })
  user.posts.push(post._id);
  await user.save();
  res.redirect('/feed');
});

router.post('/register', function (req, res, next) {
  const { username, name, email } = req.body;
  var newUser = new userModel({
    username, name, email
  })
  userModel.register(newUser, req.body.password)
    .then(function (u) {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/profile')
      })
    })
    .catch(function (e) {
      res.send(e);
    })
})


router.post('/login', passport.authenticate('local', {
  successRedirect: '/feed',
  failureRedirect: '/login'
}), function (req, res, next) { })


router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
})


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect('/login')
  }
}
module.exports = router;



