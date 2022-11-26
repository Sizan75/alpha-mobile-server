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
        
        app.get('/category', async(req,res)=>{
            const query={}
            const category=await categoryCollection.find(query).toArray()
            res.send(category)
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
                sellerEmail: email
            }
            const products= await productsCollection.find(query).toArray()
            res.send(products)
        })
        app.get('/allsellers', async(req,res)=>{
            const role= req.query.role
            const query= {
                role: role
            }
            const sellers= await usersCollection.find(query).toArray()
            res.send(sellers)
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