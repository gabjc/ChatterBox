import express from "express";
import * as dotenv from 'dotenv'
import { MongoClient, ServerApiVersion } from 'mongodb';
dotenv.config()

const uri: string = process.env.DB_CONN_STRING || ""
const app = express();

const client: MongoClient = new MongoClient(uri {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	}
})

app.get("/", (req, res) => {
	res.status(200).json({
		status: "healthy",
	});
});

app.listen(4004, () => {
	console.log("Server is listening on 4004");
});


// async function run() {
// 	try {
// 	  // Connect the client to the server	(optional starting in v4.7)
// 	  await client.connect();
// 	  // Send a ping to confirm a successful connection
// 	  await client.db("admin").command({ ping: 1 });
// 	  console.log("Pinged your deployment. You successfully connected to MongoDB!");
// 	} finally {
// 	  // Ensures that the client will close when you finish/error
// 	  await client.close();
// 	}
//   }
//   run().catch(console.dir);

//**
// 
// The password for gabtez23 is included in the connection string
//  for your first time setup. This password will not be
//  available again after exiting this connect flow. 
// */