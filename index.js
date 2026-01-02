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
    const userCollection = db.collection("userCollection");
    const productsCollection = db.collection("productsCollection");
    const importedProductsCollection = db.collection(
      "importedProductsCollection"
    );

    // Get Home Page of Global Link Hub server
    app.get("/", (req, res) => {
      res.send(" Global Link Hub website's server is running...");
    });

    // --------------------------add New Product ----------------------------------

    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    // -----------------------------get All Products or User Products by Email Filter--------------------------

    app.get("/products", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.seller_email = email;
      }
      const cursor = productsCollection.find(query).sort({ created_At: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    // ------------------------------------------------get Single Product---------------------------

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
      const product = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: product,
      };
      const options = {};
      const result = await productsCollection.updateOne(query, update, options);
      res.send(result);
    });

    // --------------------update quantity  and Create New API--------------------------

    app.put("/products/quantity/:id", async (req, res) => {
      const { id } = req.params;
      const { user_email } = req.body;
      const quantity = parseInt(req.body.quantity);
      const query = { _id: new ObjectId(id) };

      const product = await productsCollection.findOne(query);
      if (!product) {
        return res.status(404).send({ message: "product not found" });
      }
      if (quantity > product.available_quantity) {
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
        rating: product.rating,
        image: product.image,
        origin_country: product.origin_country,
        imported_quantity: quantity,
        user_email: user_email,
        imported_at: new Date(),
      };

      const result = await importedProductsCollection.insertOne(
        newImportedProduct
      );

      res.send(result);
    });

    // ------------------------- Get All Imported Product -----------------

    app.get("/importedProducts", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.user_email = email;
      }

      const cursor = importedProductsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // ------------------------- Get All Imported Product  Function End ------------------------

    // get Single  Imported API

    app.get("/importedProducts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await importedProductsCollection.findOne(query);
      res.send(result);
    });

    // Delete Imported API

    app.delete("/importedProducts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await importedProductsCollection.deleteOne(query);
      res.send(result);
    });

    // ------------------------------------------

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
