require("dotenv").config();
const _ = require("lodash");
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

console.log(_.camelCase("Papa's Schwippbogen"));
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
  identifier: String,
  name: String,
  systemCode: String,
  unitCode: Number,
  areas: [],
});

const Switch = mongoose.model("Switch", switchSchema);

switch1 = new Switch({
  identifier: _.camelCase("Papa's Schwippbogen"),
  name: "Papa's Schwippbogen",
  systemCode: "00001",
  unitCode: 1,
  areas: ["all", "SecondFloor"],
});

switch2 = new Switch({
  identifier: _.camelCase("Balkon"),
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
  const switchIdentifier = req.body.switcherIdentifier;
  console.log("switch on " + switchIdentifier);
  switchOn(switchIdentifier);
  res.redirect("/");
});

app.post("/off", function (req, res) {
  const switchIdentifier = req.body.switcherIdentifier;
  console.log("switch on " + switchIdentifier);
  switchOff(switchIdentifier);
  res.redirect("/");
});

function switchOn(switchIdentifier) {
  Switch.findOne({ identifier: switchIdentifier }, (err, foundSwitch) => {
    if (!err && foundSwitch) {
      console.log("found switch: ", foundSwitch);
      exec(
        "/home/pi/rcswitch-pi/send " +
          foundSwitch.systemCode +
          " " +
          foundSwitch.unitCode +
          " 1",
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
  });
}

function switchOff(switchIdentifier) {
  Switch.findOne({ identifier: switchIdentifier }, (err, foundSwitch) => {
    if (!err && foundSwitch) {
      console.log("found switch: ", foundSwitch);
      exec(
        "/home/pi/rcswitch-pi/send " +
          foundSwitch.systemCode +
          " " +
          foundSwitch.unitCode +
          " 0",
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
  });
}

app.listen(port, function () {
  console.log("Listening to port " + port);
});
