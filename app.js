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
app.use(express.static(__dirname + "/public"));

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

const areaSchema = new mongoose.Schema({
  identifier: String,
  name: String,
});

const switchSchema = new mongoose.Schema({
  identifier: String,
  name: String,
  systemCode: String,
  unitCode: String,
  areas: [],
});

const Area = mongoose.model("Area", areaSchema);
const Switch = mongoose.model("Switch", switchSchema);

switch1 = new Switch({
  identifier: _.camelCase("Papa's Schwippbogen"),
  name: "Papa's Schwippbogen",
  systemCode: "00001",
  unitCode: "A",
  areas: ["all", "SecondFloor"],
});

switch2 = new Switch({
  identifier: _.camelCase("Balkon"),
  name: "Balkon",
  systemCode: "00011",
  unitCode: "D",
  areas: ["all", "Outside"],
});

const defaultSwitches = [switch1, switch2];

app.get("/", (req, res) => {
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

app.get("/areas", (req, res) => {
  const message = req.query.valid;
  Area.find({}, (err, areas) => {
    if (!err) {
      res.render("confAreas", { areas: areas, message: message });
    }
  });
});

app.get("/switches", (req, res) => {
  const message = req.query.valid;
  Switch.find({}, (err, switches) => {
    if (!err) {
      res.render("confSwitches", { switches: switches, message: message });
    }
  });
});

app.post("/on", (req, res) => {
  console.log("switch on");
  const switchIdentifier = req.body.switcherIdentifier;
  switchOnOff(switchIdentifier, 1);
  res.redirect("/");
});

app.post("/off", (req, res) => {
  console.log("switch off");
  const switchIdentifier = req.body.switcherIdentifier;
  switchOnOff(switchIdentifier, 0);
  res.redirect("/");
});

app.post("/areas", (req, res) => {
  const newArea = req.body.newArea;
  // Add new area to database
  if (newArea !== "") {
    Area.findOne({ identifier: _.camelCase(newArea) }, (err, foundArea) => {
      if (err) {
        console.log(err);
        res.redirect("/areas");
      } else if (foundArea) {
        const message = encodeURIComponent("Area already exists!");
        res.redirect("/areas?valid=" + message);
      } else {
        area = new Area({
          identifier: _.camelCase(newArea),
          name: newArea,
        });
        area.save(() => {
          res.redirect("/areas");
        });
      }
    });
  }
});

app.post("/newSwitch", (req, res) => {
  const name = req.body.name;
  const systemCode = req.body.systemCode.join("");
  const unitCode = req.body.unitCode;

  Switch.findOne({ identifier: _.camelCase(name) }, (err, foundSwitch) => {
    if (err) {
      console.log(err);
      res.redirect("/switches");
    } else if (foundSwitch) {
      const message = encodeURIComponent(
        "A switch with a same or similar name already exists!"
      );
      res.redirect("/switches?valid=" + message);
    } else {
      const newSwitch = new Switch({
        identifier: _.camelCase(req.body.switchNameNew),
        name: name,
        systemCode: systemCode,
        unitCode: unitCode,
        areas: ["Erdgeschoss"],
      });

      newSwitch.save(() => {
        res.redirect("/switches");
      });
    }
  });
});

function switchOnOff(switchIdentifier, status) {
  Switch.findOne({ identifier: switchIdentifier }, (err, foundSwitch) => {
    if (!err && foundSwitch) {
      exec(
        "/home/pi/rcswitch-pi/send " +
          foundSwitch.systemCode +
          " " +
          (foundSwitch.unitCode.charCodeAt(0) - 64) +
          " " +
          status,
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
