const express = require("express");
const cors = require("cors");
var jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xlp2yoh.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      res.status(401).send({ message: 'Unauthorized' });
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    const courseCollection = client.db("PracticesDB").collection("courses");
    const orderCollection = client.db("PracticesDB").collection("orders");

    //Courses API

    app.get("/courses", async (req, res) => {
      const query = {};
      const cursor = courseCollection.find(query);
      const courses = await cursor.toArray();
      res.send(courses);
    });

    app.get("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const cursor = await courseCollection.findOne(query);
      res.send(cursor);
    });

    //Orders API

    app.get("/orders", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log('inside orders api: ', decoded);
      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "Unauthorized access" })
      }

      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email
        };
      }
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    //JWT 
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
      res.send({ token })
    })

  } finally {
  }
}
run().catch((error) => console.log(error));

app.get("/", (req, res) => {
  res.send("This server is working Perfectly");
});

app.listen(port, () => {
  console.log(`This server is running on PORT ${port}`);
});
