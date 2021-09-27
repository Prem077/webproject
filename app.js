//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");



const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");
const url = "mongodb+srv://prem119:premmarandi@cluster0.zgob3.mongodb.net/test?retryWrites=true&w=majority";
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}).then(()=>{
	console.log("connection sucessfull");
}).catch((err)=>console.log(err));

const itemsSchema = {
	name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
	name: "welcome to your todolist"
});
const item2 = new Item({
	name: "hit the + button to add a new item"
});
const item3 = new Item({
	name: "<-- hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
	name: String,
	items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){

	Item.find({}, function(err, foundItems){
		//this is the line which help you when you refresh a page it will not add again and again
		if(foundItems.length === 0){
			Item.insertMany(defaultItems, function(err){
				if(err){
					console.log(err);
				}else{
					console.log("succesfully saved all the item to itemsDB");
				}
				res.redirect("/");
			});
			//end of the line
		}else{
			res.render("list", {listTitle: "Today", newListItem: foundItems});
		}

	});

});

app.get("/:customListName", function(req, res){
	// console.log(req.params.customListName);
	const customListName = _.capitalize(req.params.customListName);

	List.findOne({name: customListName}, function(err, foundList){
		if(!err){
			if(!foundList){
				//create a new list
				const list = new List({
					name: customListName,
					items: defaultItems
				});
				list.save();
				res.redirect("/"+customListName);

			}else{
				//show an existing list
				res.render("list", {listTitle: foundList.name, newListItem: foundList.items});
			}
		}
	});

});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName,
	});
	if (listName === "Today"){
		item.save();
		res.redirect("/");
	}else{
		List.findOne({name: listName}, function(err, foundList){
			foundList.items.push(item);
			foundList.save();
			res.redirect("/"+listName);
		});
	}

});
app.post("/delete", function(req, res){
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === "Today"){
		Item.findByIdAndRemove(checkedItemId, function(err){
			if(!err){
				console.log("successfully deleted checked item.");
				res.redirect("/")//this will redirect to home page
			}
		});
	}else{
		List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: checkedItemId}}}, function(err, foundList){
			if(!err){
				res.redirect("/"+ listName);
			}
		})
	}

});
//THIS IS FOR WORK ROUTE
app.get("/work", function(req, res){
  res.render("list", {listTitle: "Work List", newListItem: workItems});
});

// app.post("/work", function(req, res){
//
//   let item = req.body.newItem;
//   workItems.push(item);
//   res.redirect("/work");
// });
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(){
  console.log("sever has started on port successfully.");
});
