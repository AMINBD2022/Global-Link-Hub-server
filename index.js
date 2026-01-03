const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();

// Middleware

app.use(cors());
app.use(express.json());
const uri = process.env.URI;
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
    const products = db.collection("products");
    const importedProducts = db.collection("importedProducts");

    // Get Home Page of Global Link Hub server
    app.get("/", (req, res) => {
      res.send(" Global Link Hub website's server is running...");
    });

    // --------------------------add New Product ----------------------------------

    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await products.insertOne(product);
      res.send(result);
    });

    // -----------------------------get All Products or User Products by Email Filter--------------------------

    app.get("/products", async (req, res) => {
      const { email, limit = 0, skip = 0 } = req.query;
      const query = {};
      if (email) {
        query.seller_email = email;
      }
      const result = await products
        .find(query)
        .limit(Number(limit))
        .skip(Number(skip))
        .sort({ created_At: -1 })
        .toArray();
      const count = await products.countDocuments(query);
      res.send({ result, total: count });
    });

    // ------------------------------------------------get Single Product---------------------------

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await products.findOne(query);
      res.send(result);
    });

    // ----------------------- Delete Product using Product Id ------------------------------

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await products.deleteOne(query);
      res.send(result);
    });

    // ---------------------------- Update Old  Product ---------------------------------

    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const product = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: product,
      };
      const options = {};
      const result = await products.updateOne(query, update, options);
      res.send(result);
    });

    // --------------------update quantity  and Create New API--------------------------

    app.put("/products/quantity/:id", async (req, res) => {
      const { id } = req.params;
      const { user_email, quantity } = req.body;
      console.log(req.body);

      const query = { _id: new ObjectId(id) };

      const product = await products.findOne(query);
      if (!product) {
        return res.status(404).send({ message: "product not found" });
      }
      await products.updateOne(query, {
        $inc: { availableQuantity: -quantity },
      });

      const importProduct = {
        product_id: product._id,
        name: product.name,
        price: product.price,
        rating: product.rating,
        image: product.image,
        origin_country: product.origin_country,
        importQty: quantity,
        user_email: user_email,
        importAt: new Date(),
      };

      const result = await importedProducts.insertOne(importProduct);

      res.send(result);
    });

    // ------------------------- Get All Imported Product -----------------

    app.get("/importedProducts", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.user_email = email;
      }

      const cursor = importedProducts.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // ------------------------- Get All Imported Product  Function End ------------------------

    // get Single  Imported API

    app.get("/importedProducts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await importedProducts.findOne(query);
      res.send(result);
    });

    // Delete Imported API

    app.delete("/importedProducts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await importedProducts.deleteOne(query);
      res.send(result);
    });

    // ------------------------------------------

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
  }
}
run().catch(console.dir);

// app.listen(port, (req, res) => {
//   console.log(`my server is running in the port : ${port}`);
// });

export default app;
