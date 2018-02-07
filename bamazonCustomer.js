// requiring the mysql package
var mysql = require('mysql');
//requiring the inquirer package
var inquirer = require("inquirer");

var key = require("./keys.js");

var amountDue;
//creating the connection to the database
var connection = mysql.createConnection(
{
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: key,
	database: 'bamazon'
});


//call back from the connection
connection.connect(function(err)
{
	// if there is an error then provide message
	if(err) throw err;
	//confirm that i am connected and give me the id
	console.log("connected as id" + connection.threadId + "\n");
	//run listProducts function
  listProducts();
});

//list the products and it to choose from by going through what is returned form the query and then begin the order
function listProducts()
{
  connection.query("SELECT * FROM products", function(err, res)
 {
  if (err) throw err;
  console.log("You can select from these items");
  for(i=0;i<res.length;i++)
  {
    console.log('Item ID ' + res[i].item_id + ' Product:' + res[i].product_name + ' Price: ' + res[i].price);
  }
    startOrder();
 })
}

//prompt the user for the Id of them item they want and how many
function startOrder()
{
	//prompting the user
  inquirer
    .prompt([
    {
      name: "ID",
      type: "input",
      message: "What is the ID of the product you would like to buy?  Please enter a number 1-10"
    },
    {
        name: "units",
        type: "input",
        message: "How many units of this particular item would you like to buy?"
    }
    //displaying results from prompts
    ]).then(function(answer)
    {
      console.log("You selected " + answer.units + " units of item number " + answer.ID);
      //grab ifo form the DB and if the units requested for are more than what is in stock cancel order,if not tell them the amount due and update stock amount in table
      connection.query('SELECT * FROM products WHERE item_id = ?',[answer.ID], function (err, res)
      {
        if(answer.units > res[0].stock_quantity)
        {
          console.log("Insufficient Quantity.  We only have " + res[0].stock_quantity + " units left of that product.");
          console.log("Order has been canceled");
        }
        else
        {
          connection.query('UPDATE products SET ? WHERE ?',
          [
            { 
              item_id: answer.ID 
            },
            {
              stock_quantity: res[0].stock_quantity - answer.units
            }
          ],
          function(err, res)
          {
            console.log(res.affectedRows + " products updated!\n");
          }       
          );
          amountDue = answer.units * res[0].price;
          console.log("You owe $" + amountDue + ".")
        }
        connection.end();
      })
    }
  );
}