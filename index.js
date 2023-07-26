
require('dotenv').config();

const express = require('express')
const mongoose = require('mongoose')
//s. commented out: const Book = require("./models/books");

const app = express()
const PORT = process.env.PORT || 3000

const bodyParser = require("body-parser");
const _ = require("lodash");

//s. commented out because error. 
//stackoverflow says don'nt need in mongoose 6.: mongoose.set('strictQuery', false);

//Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
// specific to cyclic
//Routes go here. 
// s. commented out in case i don't need it.
// but kept in case i need to use this to modify my code.
// eg: using the => {}.

//app.get('/', (req,res) => {
//  res.send({ title: 'Books' });
//})



app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//s. this next bit was personal code by other user for actual remote server. it would need to be repalaced for another server and another user//
///s. this is my code and my password. Don't put it all on google drive, or github.
mongoose.connect("mongodb+srv://steven:mgrrLZ2G2VwXNjRL@cluster0.ttpkeve.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});


//// ITEM SCHEMA////
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

////DEFAULT ITEMS////
const item1 = new Item ({
    name: "Type a new item below"
  });

const item2 = new Item ({
    name: "Click the + button to add the new item"
  });

const item3 = new Item ({
    name: "<--Click this to delete an item"
  });


const defaultItems = [item1, item2, item3];

////CUSTOM LIST ITEM SCHEMA////
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//////HOME ROUTE/////
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err); 
          } else {
            console.log("Successfully saved default items to DB");
          }
        });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })

});

/////ADD NEW ITEM/////
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (itemName !== "") {

    if (listName === "Today") {
     item.save();
     res.redirect("/");

   }  else {
     ///// for custom list////
     List.findOne({name: listName}, function(err, foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
   }
  }

});

/////CUSTOM LIST//////
app.get("/:customListName", function(req, res) {

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList) {
      if (!err) {
        if (!foundList) {

         ////create a new list////
          const list = new List ({
              name: customListName,
              items: defaultItems
            })

            list.save();
            res.redirect("/" + customListName);
        } else {

        /////Show an existing list////       
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }

      }
    })
});


////DELETE ITEM/////
app.post("/delete", function(req, res) {
  
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {

    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
       if(!err) {
         res.redirect("/" + listName);
       }
    }) 
  }

    
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

// removed from local version
//app.listen(port, function() {
//  console.log("Server has started successfully!");
//});

//Connect to the database before listening
connectDB().then(() => {
  app.listen(PORT, () => {
      console.log("listening for requests");
  })
})