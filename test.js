require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const fs = require("fs");
const exec = require("child_process").exec;

var app = express();
var port = 3000;
var rawData = fs.readFileSync(__dirname + "/data.json");
var switchData = JSON.parse(rawData);

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://" +
    process.env.DB_USER +
    ":" +
    process.env.DB_PASS +
    "@cluster0.n6crd.mongodb.net/homeDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const switchSchema = new mongoose.Schema({
  name: String,
  systemCode: String,
  unitCode: Number,
  areas: [],
});

const Switch = mongoose.model("Switch", switchSchema);

switch1 = new Switch({
  name: "Papa's Schwippbogen",
  systemCode: "00001",
  unitCode: 1,
  areas: ["all", "SecondFloor"],
});

switch2 = new Switch({
  name: "Balkon",
  systemCode: "00011",
  unitCode: 4,
  areas: ["all", "Outside"],
});

const defaultSwitches = [switch1, switch2];

app.get("/", function (req, res) {
  Switch.find({}, (err, switches) => {
    if (!err) {
      if (switches.length === 0) {
        Switch.insertMany(defaultSwitches, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully inserted default switches.");
            res.redirect("/");
          }
        });
      } else {
        res.render("list", { switches: switches });
      }
    }
  });
});

app.post("/on", function (req, res) {
  switchOn();
  res.redirect("/");
});

app.post("/off", function (req, res) {
  switchOff();
  res.redirect("/");
});

function switchOn() {
  var systemCode = switchData.fb1.systemCode;
  var unitCode = switchData.fb1.unitCode;
  exec(
    "/home/pi/rcswitch-pi/send " + systemCode + " " + unitCode + " 1",
    function (err, stdout, stderr) {
      if (err) {
        console.log("Something went wrong");
        return;
      }
      if (stderr) {
        console.log("stderr: " + stderr);
        return;
      }
      console.log("stdout: " + stdout);
    }
  );
}

function switchOff() {
  var systemCode = switchData.fb1.systemCode;
  var unitCode = switchData.fb1.unitCode;
  exec(
    "/home/pi/rcswitch-pi/send " + systemCode + " " + unitCode + " 0",
    function (err, stdout, stderr) {
      if (err) {
        console.log("Something went wrong");
        return;
      }
      if (stderr) {
        console.log("stderr: " + stderr);
        return;
      }
      console.log("stdout: " + stdout);
    }
  );
}

app.listen(port, function () {
  console.log("Listening to port " + port);
});
