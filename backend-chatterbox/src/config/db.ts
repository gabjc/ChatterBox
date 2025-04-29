import mongoose from "mongoose";
import { MONGO_URI } from "../constants/env";

const uri: string = process.env.DB_CONN_STRING || "";
// const client: MongoClient = new MongoClient(uri, {
// 	serverApi: {
// 		version: ServerApiVersion.v1,
// 		strict: true,
// 		deprecationErrors: true,
// 	},
// });

// const connectToDatabase = async () => {
// 	try {
// 		// Connect the client to the server	(optional starting in v4.7)
// 		await client.connect();
// 		// Send a ping to confirm a successful connection
// 		await client.db("admin").command({ ping: 1 });
// 		console.log(
// 			"Pinged your deployment. You successfully connected to MongoDB!"
// 		);
// 	} catch (error) {
// 		console.log("Could not connect to the database: ", error);
// 		await client.close();
// 	} finally {
// 		await client.close();
// 	}
// };

const connectToDatabase = async () => {
	try {
		await mongoose.connect(MONGO_URI);
		console.log("Successfully connected to DB");
	} catch (error) {
		console.log("Could not connect to database", error);
		process.exit(1);
	}
};

export default connectToDatabase;
