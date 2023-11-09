const express = require("express");
const cors = require("cors");
const { default: mongoose } = require("mongoose");
const Booking = require("./models/Booking.js");
const User = require("./models/User");
const Place = require("./models/Place");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const imageDownloader = require("image-downloader");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = 4000;
const bucket = "stay-vista-bucket";

mongoose.connect(process.env.MONGO_DB_URL);

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "tuvnyeqriutnoqeiurnyfvairgyaeprgaviunve";
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  })
);

async function uploadToS3(path, originalFilename, mimetype) {
  const client = new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
  const parts = originalFilename.split(".");
  const ext = parts[parts.length - 1];
  const newFilename = Date.now() + "." + ext;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Body: fs.readFileSync(path),
      Key: newFilename,
      ContentType: mimetype,
      ACL: "public-read",
    })
  );
  return `https://${bucket}.s3.amazonaws.com/${newFilename}`;
}

app.get("/test", (req, res) => {
  mongoose.connect(process.env.MONGO_DB_URL);
  res.json("test ok");
});

app.use((err, req, res, next) => {
  // Log the error for debugging (optional)
  console.error("ERRROOORRRR -> ", err);

  // Customize the error response
  res.status(err.status || 500).json({
    error: err.message,
  });
});

function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

app.post("/register", async (req, res) => {
  mongoose.connect(process.env.MONGO_DB_URL);
  const { name, email, password } = req.body;
  // const payload = { name, email, password, msg: "Registration Successfull" };
  // console.log(payload);
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.get("/profile", (req, res) => {
  mongoose.connect(process.env.MONGO_DB_URL);
  const { token } = req.cookies;
  // console.log("token ->", token);
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const { name, email, _id } = await User.findById(userData.id);
      res.json({ name, email, _id });
      console.log("Profile loaded successfully");
    });
  } else {
    res.json(null);
  }
});

// app.post("/api/logout", (req, res) => {
//   res.cookie("token", "").json(true);
// });

app.post("/login", async (req, res) => {
  // console.log(process.env.MONGO_DB_URL);
  mongoose.connect(process.env.MONGO_DB_URL);
  const { email, password } = req.body;
  console.log({ email, password });
  const userDoc = await User.findOne({ email });
  console.log("userDoc ---> ", userDoc);
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign(
        {
          email: userDoc.email,
          id: userDoc._id,
        },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).json(userDoc);
        }
      );
    } else {
      res.status(422).json("pass not ok");
    }
    // res.json("found");
  } else {
    res.json("not found");
  }
});

app.post("/upload-by-link", async (req, res, next) => {
  // mongoose.connect(process.env.MONGO_DB_URL);
  const { link } = req.body;
  const newName = "photo" + Date.now() + ".jpg";
  try {
    await imageDownloader.image({
      url: link,
      dest: "/tmp/" + newName,
      // dest: __dirname + "/uploads/" + newName,
    });
    const url = await uploadToS3(
      "/tmp/" + newName,
      newName,
      mime.lookup("/tmp/" + newName)
    );
    res.json(url);
    // res.json(newName);
  } catch (e) {
    next(e);
  }
});

const photosMiddleware = multer({ dest: "/tmp" });
app.post(
  "/upload",
  photosMiddleware.array("photos", 100),

  async (req, res) => {
    mongoose.connect(process.env.MONGO_DB_URL);
    // console.log("REQ FILES ---> ", req.files);
    const uploadedFiles = [];
    for (let i = 0; i < req.files.length; i++) {
      const { path, originalname } = req.files[i];
      const parts = originalname.split(".");
      const ext = parts[parts.length - 1];
      const newPath = path + "." + ext;
      fs.renameSync(path, newPath);
      uploadedFiles.push(newPath.replace("uploads/", ""));
    }
    res.json(uploadedFiles);
  }
);

app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

app.post("/places", (req, res) => {
  mongoose.connect(process.env.MONGO_DB_URL);
  const { token } = req.cookies;
  const {
    title,
    address,
    photos: addedPhotos,
    description,
    price,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      owner: userData.id,
      price,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
    });
    res.json(placeDoc);
  });
});

app.get("/user-places", (req, res) => {
  mongoose.connect(process.env.MONGO_DB_URL);
  const { token } = req.cookies;
  console.log("token [/places] ->", token);
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const { id } = userData;
    res.json(await Place.find({ owner: id }));
  });
});

app.get("/places", async (req, res) => {
  mongoose.connect(process.env.MONGO_DB_URL);
  res.json(await Place.find());
});

app.get("/places/:id", async (req, res) => {
  mongoose.connect(process.env.MONGO_DB_URL);
  const { id } = req.params;
  console.log("id [/places] ->", id);
  res.json(await Place.findById(id));
});

app.put("/places", async (req, res) => {
  mongoose.connect(process.env.MONGO_DB_URL);
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
        price,
      });
      await placeDoc.save();
      res.json("ok");
    }
  });
});

app.post("/bookings", async (req, res) => {
  mongoose.connect(process.env.MONGO_DB_URL);
  const userData = await getUserDataFromReq(req);
  const { place, checkIn, checkOut, numberOfGuests, name, phone, price } =
    req.body;
  Booking.create({
    place,
    checkIn,
    checkOut,
    numberOfGuests,
    name,
    phone,
    price,
    user: userData.id,
  })
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      throw err;
    });
});

app.get("/bookings", async (req, res) => {
  mongoose.connect(process.env.MONGO_DB_URL);
  const userData = await getUserDataFromReq(req);
  res.json(await Booking.find({ user: userData.id }).populate("place"));
});

app.listen(PORT, () => console.log("Running on port " + PORT));
