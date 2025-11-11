const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();

// Middleware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.GLOBALLINKHUB_USER}:${process.env.GLOBALLINKHUB_PASS}@cluster0.ty9bkxj.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("GlobalLinkGubDataBase");
    const userCollection = db.collection("userCollection");
    const productsCollection = db.collection("productsCollection");
    const importedProductsCollection = db.collection(
      "importedProductsCollection"
    );

    // Get Home Page of my server
    app.get("/", (req, res) => {
      res.send({ message: "this server is only for Global Link Hub website" });
    });

    // Add New User to server

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    // Get All User

    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // ------------------------------------------------------------add New Product -----------------------------------------------------------

    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      console.log(newProduct);
      if (newProduct.available_quantity) {
        newProduct.available_quantity = parseInt(newProduct.available_quantity);
      }

      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    // -----------------------------get All Products or User Products by Email Filter--------------------------

    app.get("/products", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.buyer_email = email;
      }
      const cursor = productsCollection.find(query).sort({ created_At: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    // get Single Product

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // ----------------------- Delete Product using Product Id ------------------------------

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // ---------------------------- Update Old  Product ---------------------------------

    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const updateProduct = req.body;
      const query = { _id: new ObjectId(id) };
      if (updateProduct.available_quantity) {
        updateProduct.available_quantity = parseInt(
          updateProduct.available_quantity
        );
      }
      const update = {
        $set: updateProduct,
      };
      const options = {};
      const result = await productsCollection.updateOne(query, update, options);
      res.send(result);
    });

    // --------------------------------------------------update quantity  and Create New API------------------------------------------

    app.put("/products/quantity/:id", async (req, res) => {
      const { id } = req.params;
      const quantity = parseInt(req.body.quantity);
      const query = { _id: new ObjectId(id) };

      const product = await productsCollection.findOne(query);
      if (!product) {
        return res.status(404).send({ message: "product not found" });
      }
      const available_quantity = parseInt(product.available_quantity);

      if (quantity > available_quantity) {
        return res.status(400).send({ message: "Not enough stock available" });
      }
      if (quantity === 0 || quantity < 0) {
        return res
          .status(400)
          .send({ message: "quantity can not be 0 or nagitive" });
      }

      await productsCollection.updateOne(query, {
        $inc: { available_quantity: -quantity },
      });

      const newImportedProduct = {
        product_id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        imported_quantity: quantity,
        buyer_email: product.buyer_email,
        imported_at: new Date(),
      };

      const importedProduct = await importedProductsCollection.insertOne(
        newImportedProduct
      );

      res.send(importedProduct);
    });

    // ------------------------- Get All Imported Product -----------------

    app.get("/importedProducts", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.buyer_email = email;
      }

      const cursor = importedProductsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // ------------------------- Get All Imported Product  Function End ------------------------

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, (req, res) => {
  console.log(`my server is running in the port : ${port}`);
});

module.exports = app;
