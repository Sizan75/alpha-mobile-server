const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express()
require('dotenv').config();
const port = process.env.PORT || 5000
app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bahxlpw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    console.log(authHeader)
    if (!authHeader) {
        res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbiden access' })
        }
        req.decoded = decoded
        next()
    })
}


async function run(){
    try{
        const categoryCollection = client.db('alphaMobile').collection('mobileCategories')
        const usersCollection= client.db('alphaMobile').collection('users')
        const productsCollection= client.db('alphaMobile').collection('products')
        const ordersCollection= client.db('alphaMobile').collection('bookings')
        const paymentsCollection= client.db('alphaMobile').collection('payments')
        const reportedProductCollection= client.db('alphaMobile').collection('reportedProducts')
        

        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }


        app.get('/category', async(req,res)=>{
            const query={}
            const category=await categoryCollection.find(query).toArray()
            res.send(category)
        })

        app.get('/reports', async(req,res)=>{
            const query={}
            const report=await reportedProductCollection.find(query).toArray()
            res.send(report)
        })
        app.post('/bookings', async(req, res) => {
            const bookingInfo = req.body;
            const bookingProducts = await ordersCollection.insertOne(bookingInfo);
            res.send(bookingProducts);
        })
// JWT 
app.get('/jwt', async(req,res)=>{
    const email= req.query.email
    const query= {email: email}
    const user= await usersCollection.findOne(query)
    if(user){
        const token= jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '7d'})
        return res.send({accessToken: token})
    }
    res.status(403).send({accessToken: 'Can Not found user'})
})


        app.put('/bookedProducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}

            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                   bookingstatus: 'booked'
                }
            }
            const result = await productsCollection.updateOne(query, updatedDoc, options)
            res.send(result);
        })

        app.get('/category/:id', async(req,res)=>{
            const id= req.params.id
            const query={
                categoryId: id
            }
            const result= await productsCollection.find(query).toArray()
            res.send(result)
        })
        app.post('/users', async(req,res)=>{
            const user=req.body
            const result= await usersCollection.insertOne(user)
            res.send(result)
        })
        app.post('/products', async(req,res)=>{
            const user=req.body
            const result= await productsCollection.insertOne(user)
            res.send(result)
        })
        app.get('/myproducts', verifyJWT,  async(req,res)=>{
            
            const email= req.query.email
            const query= {
                email: email
            }
            const products= await productsCollection.find(query).toArray()
            res.send(products)
        })
        app.get('/myorders', async(req,res)=>{
            const email= req.query.email
           
            const query= {
                userEmail: email
            }
            const orders= await ordersCollection.find(query).toArray()
            res.send(orders)
        })
        app.get('/users',verifyJWT, verifyAdmin, async(req,res)=>{
            const role= req.query.role
            const query= {
                role: role
            }
            const sellers= await usersCollection.find(query).toArray()
            res.send(sellers)
        })

        app.get('/users/admin/:email', async(req,res)=>{
            const email = req.params.email
            const query={ email}
            const user= await usersCollection.findOne(query)
            res.send({isAdmin: user?.role === 'admin'})
        })
        app.get('/users/buyers/:email', async(req,res)=>{
            const email = req.params.email
            const query={ email}
            const user= await usersCollection.findOne(query)
            res.send({isBuyer: user?.role === 'buyer'})
        })
        app.get('/users/sellers/:email', async(req,res)=>{
            const email = req.params.email
            const query={ email}
            const user= await usersCollection.findOne(query)
            res.send({isSeller: user?.role === 'seller'})
        })
        app.put('/seller', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
           const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    status: 'Verified'
                }
            }
            const result = await usersCollection.updateOne(query, updatedDoc, options);
            const result2 = await productsCollection.updateMany(query, updatedDoc, options);
            res.send(result2);
        })

        app.get('/advertise', async(req,res)=>{
            const advertiseStatus= req.query.advertiseStatus
            const query= {
                advertiseStatus: advertiseStatus
            }
            const result= await productsCollection.find(query).toArray()
            res.send(result)
        })
// payment 
        app.get('/orders/:id', async(req, res) => {
            const id = req.params.id;
           const query = {_id: ObjectId(id)};
            const order = await ordersCollection.findOne(query);
            res.send(order)
        })


        app.post('/create-payment-intent', async(req, res) => {
            const booking = req.body;
            console.log(booking)
            const price = booking.sellingPrice;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                "payment_method_types": [
                    "card"
                ],

            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        })

        app.post('/payments', async(req, res) => {
            const booking = req.body;
            const result = await paymentsCollection.insertOne(booking);

            const id = booking.bookingId;
            const query = {_id: ObjectId(id)};

            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: booking.transactionId
                }
            }
            const bookingData = await ordersCollection.updateOne(query, updatedDoc)
            res.send(result);
        })

        app.post('/reports', async(req,res)=>{
            const report= req.body
            const result= await reportedProductCollection.insertOne(report)
            res.send(result)
        })
 
        app.put('/myproducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    advertiseStatus: 'advertised'
                }
            }
            const result = await productsCollection.updateOne(query, updatedDoc, options)
            res.send(result);
        })
         

        app.delete('/users/:id', async(req,res)=>{
            const id= req.params.id
            const filter= {_id: ObjectId(id)}
            const result = await usersCollection.deleteOne(filter)
            res.send(result)
        })
        app.delete('/myproducts/:id', verifyJWT, async(req,res)=>{
            const decodedEmail = req.decoded.email;
            const query1 = { email: decodedEmail };
            const user = await usersCollection.findOne(query1);

            if (user?.role !== 'seller') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const id= req.params.id
            const filter= {_id: ObjectId(id)}
            const result = await productsCollection.deleteOne(filter)
            res.send(result)
        })
    }
    finally{

    }
}
run().catch(err=>console.log(err))

app.get('/',(req,res)=>{
    res.send('alpha mobile server is running')
})

app.listen(port, ()=>{
    console.log(`alpha mobile running on port ${port}`)
})