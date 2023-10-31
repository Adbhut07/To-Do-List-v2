//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");
require('dotenv').config();


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true,});

const itemsSchema ={
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name:"welcome to your to-do list!",
});
const item2 = new Item({
  name:"Hit the + button to add new data.",
});
const item3 = new Item({
  name:"<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) {

  //const day = date.getDate();

  Item.find({})
  .then(foundItems => {
    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
      .then(() => {
        console.log("Items successfully saved!");
      })
      .catch((error) => {
        console.error("Error inserting items", error);
      });
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
  .catch(err => {
    console.error(err);
  });

});

app.post("/", (req, res)=>{

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if(listName=== "Today"){
    item.save();
    res.redirect("/"); 
  } else{
    List.findOne({ name: listName })
    .then(foundList => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Internal Server Error");
    });
  }
  
});

app.post("/delete", (req,res)=>{
  const checkedItemId = req.body.checkbox;
  const listName = _.capitalize(req.body.listName);

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
    .then(() => {
      console.log("successfully deleted checked item");
      res.redirect("/");
    })
    .catch((error) => {
      console.error("Error deleting item:", error);
    });
  } else{
    List.findOneAndUpdate({name:listName},{$pull: {items: {_id: checkedItemId}}})
    .then(()=>{
      res.redirect("/" + listName);
    })
    .catch((err)=>{
      console.error("error deletion item",err);
    })
  }

});

app.get("/:customListName", (req,res)=>{
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
  .then(foundList => {
    if (!foundList) {
      //if list doesn't exist already
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      list.save();
      res.redirect("/"+ customListName);
    } else {
      //showing an existing list 
      res.render("list",  {listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch(err => {
    console.error(err);
  });

  
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
