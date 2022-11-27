const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express()
require('dotenv').config();
const port = process.env.PORT || 5000
app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bahxlpw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const categoryCollection = client.db('alphaMobile').collection('mobileCategories')
        const usersCollection= client.db('alphaMobile').collection('users')
        const productsCollection= client.db('alphaMobile').collection('products')
        const bookingsCollection= client.db('alphaMobile').collection('bookings')
        
        app.get('/category', async(req,res)=>{
            const query={}
            const category=await categoryCollection.find(query).toArray()
            res.send(category)
        })
        app.post('/bookings', async(req, res) => {
            const bookingInfo = req.body;
            const bookingProducts = await bookingsCollection.insertOne(bookingInfo);
            res.send(bookingProducts);
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
        app.get('/myproducts', async(req,res)=>{
            const email= req.query.email
            const query= {
                email: email
            }
            const products= await productsCollection.find(query).toArray()
            res.send(products)
        })
        app.get('/myorders', async(req,res)=>{
            const email= req.query.email
            console.log(email)
            const query= {
                userEmail: email
            }
            const orders= await bookingsCollection.find(query).toArray()
            res.send(orders)
        })
        app.get('/users', async(req,res)=>{
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
        app.delete('/myproducts/:id', async(req,res)=>{
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
    res.send('doctors portal server is running')
})

app.listen(port, ()=>{
    console.log(`doctors portal running on port ${port}`)
})