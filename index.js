const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oal61s0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // all databases
    const neonDb = client.db('Neon');
    const userCollection = neonDb.collection('users');
    const assetsCollection = neonDb.collection('assets');
    const employeeCollection = neonDb.collection('employee');

    // add a user to the user database
    app.post('/users', async (req, res) => {
      const user = req.body;
      const email = req.body.email;
      if (await userCollection.findOne({ email: email })) {
        return res.status(400).send({ message: 'User already exists' });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // finding a user role

    app.get('/users/role/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // Only HR manger related api's
    app.post('/addAssets', async (req, res) => {
      const asset = req.body;
      const result = await assetsCollection.insertOne(asset);
      res.send(result);
    });

    // load assets list with the hr email
    app.get('/assetsList/hr/:email', async (req, res) => {
      const email = req.params.email;
      const { type, search } = req.query;
      let query = { ownerEmail: email };
      if (type) {
        query.productType = type;
      }
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }
      const result = await assetsCollection.find(query).toArray();
      res.send(result);
    });

    // delete a asset
    app.delete('/deleteAssets/:id', async (req, res) => {
      const id = req.params.id;
      const result = await assetsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // get request for loading a single asset with id
    app.get('/assets/:id', async (req, res) => {
      const id = req.params.id;
      const result = await assetsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // update a specific asset
    app.put('/assetUpdate/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const { name, quantity, productType } = req.body;
      const updateDoc = {
        $set: { name: name, quantity: quantity, productType: productType },
      };
      const result = await assetsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // fetch role=employee users
    app.get('/employeeList/:role', async (req, res) => {
      const role = req.params.role;
      const query = { role: role };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    // add a employee in the employee collection
    app.post('/addEmployee', async (req, res) => {
      const employee = req.body;
      const { email } = employee;
      const isExist = await employeeCollection.findOne({ email: email });
      if (isExist) {
        return res.status(400).send({ message: 'Employee already exists' });
      }
      const result = await employeeCollection.insertOne(employee);
      res.send(result);
    });

    // get a specific hr's employees data from the employee collection with the use of hr's email
    app.get('/employeeList/hr/:email', async (req, res) => {
      const email = req.params.email;
      const result = await employeeCollection
        .find({ HrEmail: email })
        .toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db('admin').command({ ping: 1 });
    // console.log(
    //   'Pinged your deployment. You successfully connected to MongoDB!'
    // );
  } finally {
    // // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
