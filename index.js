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

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
