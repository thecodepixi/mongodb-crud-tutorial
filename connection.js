const { MongoClient } = require('mongodb');

async function main() {
  const uri =
    'mongodb+srv://dbAdmin:Ki7SfcqQo4aq883o@practicecluster-w01sj.gcp.mongodb.net/test?retryWrites=true&w=majority';

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    // await listDatabases(client);

    // await createListing(client, {
    //   name: 'Lovely Loft',
    //   summary: 'A Charming Loft in Paris',
    //   bedroom: 1,
    //   bathroom: 1,
    // });

    // await createMultipleListings(client, [
    //   {
    //     name: 'Infinite Views',
    //     summary: 'Modern home with infinite views from the infinity pool',
    //     property_type: 'House',
    //     bedrooms: 5,
    //     bathrooms: 4.5,
    //     beds: 5,
    //   },
    //   {
    //     name: 'Private room in London',
    //     property_type: 'Apartment',
    //     bedrooms: 1,
    //     bathroom: 1,
    //   },
    //   {
    //     name: 'Beautiful Beach House',
    //     summary:
    //       'Enjoy relaxed beach living in this house with a private beach',
    //     bedrooms: 4,
    //     bathrooms: 2.5,
    //     beds: 7,
    //     last_review: new Date(),
    //   },
    // ]);

    // await findOneListingByName(client, 'Infinite Views');

    // await findManyListings(client, {
    //   minBedrooms: 4,
    //   minBathrooms: 2,
    //   maxResults: 5,
    // });

    // await updateListingByName(client, 'Infinite Views', {
    //   bedrooms: 6,
    //   beds: 8,
    // });

    // await upsertListingByName(client, '228 Zoo', {
    //   name: '228 Zoo',
    //   bedrooms: 4,
    //   bathrooms: 1,
    // });

    // await findOneListingByName(client, 'Cozy Cottage');

    // await updateListingsToHavePropertyType(client);

    // await deleteListingByName(client, 'Harber House');

    await deleteListingsScrapedBeforeDate(client, new Date('2019-02-15'));
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

//Basic Cluster connection that lists all databases in the Cluster
async function listDatabases(client) {
  //grab a list of all databases
  databasesList = await client.db().admin().listDatabases();
  //output the list to the console
  console.log('Databases:');
  databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
}

//CREATE
//Insert a single document into a DB
async function createListing(client, newListing) {
  //result variable will be the return of the created document
  const result = await client
    //connect to the db
    .db('sample_airbnb')
    //choose the db collection to insert into
    .collection('listingsAndReviews')
    //insert the document
    .insertOne(newListing);
  console.log(
    `New listing created with the following id:, ${result.insertedId}`
  );
}

//Insert multiple documents at once
async function createMultipleListings(client, newListings) {
  const result = await client
    //select db
    .db('sample_airbnb')
    //select the collection
    .collection('listingsAndReviews')
    //use insertMany
    .insertMany(newListings);
  console.log(
    `${result.insertedCount} new listing(s) created with the follow id(s):`
  );
  console.log(result.insertedIds);
}

//READ
//Read One Document from a DB
async function findOneListingByName(client, nameOfListing) {
  //save the result of the query to a variable
  const result = await client
    //select the db
    .db('sample_airbnb')
    //select the collection to search
    .collection('listingsAndReviews')
    //use findOne with a query object
    .findOne({ name: nameOfListing });

  if (result) {
    console.log(
      `Found a listing in the collection with the name '${nameOfListing}':`
    );
    console.log(result);
  } else {
    console.log(`No listings found with the name '${nameOfListing}`);
  }
}

//Read multiple document from a db
//more info on mongoDB comparison operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/
async function findManyListings(
  client,
  {
    minBedrooms = 0,
    minBathrooms = 0,
    maxResults = Number.MAX_SAFE_INTEGER,
  } = {}
) {
  const cursor = client
    .db('sample_airbnb')
    .collection('listingsAndReviews')
    //find documents based on a query, with comparison operators to ensure we get results with greater-than-or-equal results to our arguments
    .find({
      bedrooms: { $gte: minBedrooms },
      bathrooms: { $gte: minBathrooms },
    })
    //sort returned documents in descending order
    .sort({ last_review: -1 })
    //limit the quantity returned to a specified number
    .limit(maxResults);

  //turn the returned cursor into an array of documents
  const results = await cursor.toArray();

  if (results.length > 0) {
    console.log(
      `Found ${results.length} listing(s) with at least ${minBathrooms} bathrooms and at least ${minBedrooms} bedrooms:`
    );
    results.forEach((result, i) => {
      date = new Date(result.last_review).toDateString();
      console.log();
      console.log(`${i + 1}. name: ${result.name}`);
      console.log(`   _id: ${result._id}`);
      console.log(`   bedrooms: ${result.bedrooms}`);
      console.log(`   bathrooms: ${result.bathrooms}`);
      console.log(`   most recent review date: ${date}`);
    });
  } else {
    console.log(
      `No listings found with at least ${minBathrooms} bathrooms and at least ${minBedrooms} bedrooms.`
    );
  }
}

//UPDATE
//update one document with .updateOne()
//updates the first document that matches a given query
//more info on update operators: https://docs.mongodb.com/manual/reference/operator/update/
async function updateListingByName(client, nameOfListing, updatedListing) {
  const result = await client
    .db('sample_airbnb')
    .collection('listingsAndReviews')
    //the first parameter is the query for the listing we want to update, the second parameter is the change we want to make. $set sets the value of a field in a document.
    .updateOne({ name: nameOfListing }, { $set: updatedListing });

  console.log(
    `${result.matchedCount} document(s) found matched the query criteria`
  );
  console.log(`${result.modifiedCount} document(s) was/were updated`);
}

//'Upsert' One Document
//upserting allows you to update a document if it exists, and insert it if it does not
async function upsertListingByName(client, nameOfListing, updatedListing) {
  const result = await client
    .db('sample_airbnb')
    .collection('listingsAndReviews')
    .updateOne(
      { name: nameOfListing },
      { $set: updatedListing },
      //include the following to use the upsert option
      { upsert: true }
    );

  //return info about whether the document was updated or inserted
  console.log(`${result.matchedCount} document(s) matched the query criteria`);
  //result.upsertedCount will be > 0 if document was inserted
  if (result.upsertedCount > 0) {
    console.log(
      `One document was inserted with the id ${result.upsertedId._id}`
    );
  } else {
    console.log(`${result.modifiedCount} document(s) was/were updated.`);
  }
}

//Update multiple documents with .updateMany()
//for ex: making sure all documents have a specific field, eg: 'property_type'
async function updateListingsToHavePropertyType(client) {
  const result = await client
    .db('sample_airbnb')
    .collection('listingsAndReviews')
    .updateMany(
      { property_type: { $exists: false } },
      { $set: { property_type: 'Unknown' } }
    );
  console.log(`${result.matchedCount} document(s) matched the query criteria`);
  console.log(`${result.modifiedCount} document(s) were updated`);
}

//DELETE
//delete one document with .deleteOne()
async function deleteListingByName(client, nameOfListing) {
  const result = await client
    .db('sample_airbnb')
    .collection('listingsAndReviews')
    .deleteOne({ name: nameOfListing });

  console.log(`${result.deletedCount} document(s) were deleted.`);
}

//deleting multiple documents with .deleteMany()
async function deleteListingsScrapedBeforeDate(client, date) {
  const result = await client
    .db('sample_airbnb')
    .collection('listingsAndReviews')
    .deleteMany({ last_scraped: { $lt: date } });

  console.log(`${result.deletedCount} document(s) were deleted`);
}

main().catch(console.error);
